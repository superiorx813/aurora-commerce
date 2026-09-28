import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";

import { db } from "@/lib/db";

import fs from "fs/promises";

import path from "path";

/* =========================================================
   HELPERS
========================================================= */

const uploadDirectory = path.join(
  process.cwd(),
  "public",
  "uploads",
  "profiles"
);

const allowedImageTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const maxImageSize = 5 * 1024 * 1024;

/* =========================================================
   GET PROFILE
========================================================= */

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "You are not logged in.",
        },
        {
          status: 401,
        }
      );
    }

    const [rows] = await db.query(
      `
        SELECT
          id,
          name,
          email,
          phone,
          profile_image,
          date_of_birth,
          gender,
          address,
          city,
          state,
          pincode,
          role,
          created_at
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [session.id]
    );

    const user = (rows as any[])[0];

    if (!user) {
      return NextResponse.json(
        {
          error: "User profile not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        user: {
          id: Number(user.id),
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          profileImage:
            user.profile_image || null,
          dateOfBirth:
            user.date_of_birth
              ? formatDateForInput(
                  user.date_of_birth
                )
              : "",
          gender: user.gender || "",
          address: user.address || "",
          city: user.city || "",
          state: user.state || "",
          pincode: user.pincode || "",
          role: user.role,
          createdAt: user.created_at,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "Profile GET error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load profile.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   UPDATE PROFILE
========================================================= */

export async function PATCH(req: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "You are not logged in.",
        },
        {
          status: 401,
        }
      );
    }

    const formData = await req.formData();

    /*
      IMPORTANT:

      We intentionally DO NOT read:
        formData.get("name")
        formData.get("email")

      Therefore Full Name and Email cannot be
      modified through this endpoint.
    */

    const phone = getString(
      formData.get("phone")
    );

    const dateOfBirth = getString(
      formData.get("dateOfBirth")
    );

    const gender = getString(
      formData.get("gender")
    );

    const address = getString(
      formData.get("address")
    );

    const city = getString(
      formData.get("city")
    );

    const state = getString(
      formData.get("state")
    );

    const pincode = getString(
      formData.get("pincode")
    );

    if (phone.length > 30) {
      return NextResponse.json(
        {
          error:
            "Phone number is too long.",
        },
        {
          status: 400,
        }
      );
    }

    if (dateOfBirth) {
      const validDate =
        /^\d{4}-\d{2}-\d{2}$/.test(
          dateOfBirth
        );

      if (!validDate) {
        return NextResponse.json(
          {
            error:
              "Please enter a valid date of birth.",
          },
          {
            status: 400,
          }
        );
      }
    }

    if (gender.length > 30) {
      return NextResponse.json(
        {
          error:
            "Gender value is too long.",
        },
        {
          status: 400,
        }
      );
    }

    if (address.length > 500) {
      return NextResponse.json(
        {
          error:
            "Address is too long.",
        },
        {
          status: 400,
        }
      );
    }

    if (city.length > 100) {
      return NextResponse.json(
        {
          error: "City is too long.",
        },
        {
          status: 400,
        }
      );
    }

    if (state.length > 100) {
      return NextResponse.json(
        {
          error:
            "State is too long.",
        },
        {
          status: 400,
        }
      );
    }

    if (pincode.length > 20) {
      return NextResponse.json(
        {
          error:
            "Pincode is too long.",
        },
        {
          status: 400,
        }
      );
    }

    await db.query(
      `
        UPDATE users
        SET
          phone = ?,
          date_of_birth = ?,
          gender = ?,
          address = ?,
          city = ?,
          state = ?,
          pincode = ?
        WHERE id = ?
      `,
      [
        phone || null,
        dateOfBirth || null,
        gender || null,
        address || null,
        city || null,
        state || null,
        pincode || null,
        session.id,
      ]
    );

    /*
      Optional profile image.
    */

    const image = formData.get(
      "profileImage"
    );

    if (
      image &&
      image instanceof File &&
      image.size > 0
    ) {
      if (
        !allowedImageTypes.includes(
          image.type
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Only JPG, JPEG, PNG and WEBP images are allowed.",
          },
          {
            status: 400,
          }
        );
      }

      if (image.size > maxImageSize) {
        return NextResponse.json(
          {
            error:
              "Profile image must be smaller than 5 MB.",
          },
          {
            status: 400,
          }
        );
      }

      await fs.mkdir(
        uploadDirectory,
        {
          recursive: true,
        }
      );

      /*
        Remove the old image first.
      */

      const [oldRows] =
        await db.query(
          `
            SELECT profile_image
            FROM users
            WHERE id = ?
            LIMIT 1
          `,
          [session.id]
        );

      const oldUser =
        (oldRows as any[])[0];

      if (
        oldUser?.profile_image
      ) {
        await deleteStoredImage(
          oldUser.profile_image
        );
      }

      const extension =
        getExtension(
          image.type
        );

      const fileName =
        `user-${session.id}-${Date.now()}${extension}`;

      const filePath =
        path.join(
          uploadDirectory,
          fileName
        );

      const bytes =
        await image.arrayBuffer();

      await fs.writeFile(
        filePath,
        Buffer.from(bytes)
      );

      const imageUrl =
        `/uploads/profiles/${fileName}`;

      await db.query(
        `
          UPDATE users
          SET profile_image = ?
          WHERE id = ?
        `,
        [
          imageUrl,
          session.id,
        ]
      );
    }

    const [rows] = await db.query(
      `
        SELECT
          id,
          name,
          email,
          phone,
          profile_image,
          date_of_birth,
          gender,
          address,
          city,
          state,
          pincode,
          role,
          created_at
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [session.id]
    );

    const user = (rows as any[])[0];

    return NextResponse.json(
      {
        ok: true,
        message:
          "Profile updated successfully.",
        user: {
          id: Number(user.id),
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          profileImage:
            user.profile_image || null,
          dateOfBirth:
            user.date_of_birth
              ? formatDateForInput(
                  user.date_of_birth
                )
              : "",
          gender: user.gender || "",
          address: user.address || "",
          city: user.city || "",
          state: user.state || "",
          pincode: user.pincode || "",
          role: user.role,
          createdAt: user.created_at,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Profile PATCH error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update profile.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   DELETE PROFILE IMAGE
========================================================= */

export async function DELETE() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "You are not logged in.",
        },
        {
          status: 401,
        }
      );
    }

    const [rows] = await db.query(
      `
        SELECT profile_image
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [session.id]
    );

    const user = (rows as any[])[0];

    if (!user) {
      return NextResponse.json(
        {
          error:
            "User profile not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (user.profile_image) {
      await deleteStoredImage(
        user.profile_image
      );
    }

    await db.query(
      `
        UPDATE users
        SET profile_image = NULL
        WHERE id = ?
      `,
      [session.id]
    );

    return NextResponse.json(
      {
        ok: true,
        message:
          "Profile image deleted.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Profile image DELETE error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete profile image.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   HELPERS
========================================================= */

function getString(
  value: FormDataEntryValue | null
) {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value.trim();
}

function formatDateForInput(
  value: any
) {
  if (value instanceof Date) {
    return value
      .toISOString()
      .slice(0, 10);
  }

  const stringValue =
    String(value);

  return stringValue.slice(
    0,
    10
  );
}

function getExtension(
  mimeType: string
) {
  switch (mimeType) {
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";

    case "image/png":
      return ".png";

    case "image/webp":
      return ".webp";

    default:
      return ".jpg";
  }
}

async function deleteStoredImage(
  imageUrl: string
) {
  if (
    !imageUrl.startsWith(
      "/uploads/profiles/"
    )
  ) {
    return;
  }

  const fileName =
    path.basename(imageUrl);

  const filePath =
    path.join(
      uploadDirectory,
      fileName
    );

  try {
    await fs.unlink(filePath);
  } catch {
    /*
      File may already be missing.
    */
  }
}