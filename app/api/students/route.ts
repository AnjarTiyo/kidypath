import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { students, classrooms, users, parentChild } from "@/lib/db/schema"
import { desc, asc, sql, or, ilike, eq, inArray, and } from "drizzle-orm"

// GET - List students with pagination, search, sorting, filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const search = searchParams.get("search") || ""
    const classroomFilter = searchParams.get("classroom") || ""
    const genderFilter = searchParams.get("gender") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Build where conditions
    const conditions = []
    
    if (search) {
      conditions.push(
        or(
          ilike(students.fullName, `%${search}%`)
        )
      )
    }

    if (classroomFilter && classroomFilter !== "all") {
      conditions.push(eq(students.classroomId, classroomFilter))
    }

    if (genderFilter && genderFilter !== "all") {
      conditions.push(eq(students.gender, genderFilter))
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)

    // Build order by clause
    const orderByColumn = sortBy === "fullName" ? students.fullName : students.createdAt
    const orderByDirection = sortOrder === "asc" ? asc(orderByColumn) : desc(orderByColumn)

    // Get paginated data with relations
    const data = await db
      .select({
        id: students.id,
        fullName: students.fullName,
        birthDate: students.birthDate,
        gender: students.gender,
        classroomId: students.classroomId,
        classroomName: classrooms.name,
        createdAt: students.createdAt,
      })
      .from(students)
      .leftJoin(classrooms, eq(students.classroomId, classrooms.id))
      .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
      .orderBy(orderByDirection)
      .limit(pageSize)
      .offset((page - 1) * pageSize)

    // Get parents for each student
    const studentIds = data.map(s => s.id)
    const parentsData = studentIds.length > 0 ? await db
      .select({
        childId: parentChild.childId,
        parentId: users.id,
        parentName: users.fullName,
        parentEmail: users.email,
      })
      .from(parentChild)
      .innerJoin(users, eq(parentChild.parentId, users.id))
      .where(inArray(parentChild.childId, studentIds)) : []

    // Combine data with parents
    const studentsWithParents = data.map(student => ({
      ...student,
      parents: parentsData
        .filter(p => p.childId === student.id)
        .map(p => ({
          id: p.parentId,
          name: p.parentName,
          email: p.parentEmail,
        })),
    }))

    const totalPages = Math.ceil(count / pageSize)

    return NextResponse.json({
      data: studentsWithParents,
      pagination: {
        page,
        pageSize,
        totalCount: count,
        totalPages,
      },
    })
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create new student
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check authorization (admin or teacher)
    if (session.user.role !== "admin" && session.user.role !== "teacher" && !session.user.isCurriculumCoordinator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { fullName, birthDate, gender, classroomId, parentIds } = body

    // Validation
    if (!fullName) {
      return NextResponse.json(
        { error: "Nama lengkap harus diisi" },
        { status: 400 }
      )
    }

    if (!gender) {
      return NextResponse.json(
        { error: "Jenis kelamin harus dipilih" },
        { status: 400 }
      )
    }

    if (gender !== "male" && gender !== "female") {
      return NextResponse.json(
        { error: "Jenis kelamin tidak valid" },
        { status: 400 }
      )
    }

    // Verify classroom exists if provided
    if (classroomId) {
      const [classroom] = await db
        .select()
        .from(classrooms)
        .where(eq(classrooms.id, classroomId))
        .limit(1)

      if (!classroom) {
        return NextResponse.json(
          { error: "Kelas tidak ditemukan" },
          { status: 404 }
        )
      }
    }

    // Verify parents exist if provided
    if (parentIds && parentIds.length > 0) {
      const parents = await db
        .select()
        .from(users)
        .where(
          and(
            inArray(users.id, parentIds),
            eq(users.role, 'parent')
          )
        )

      if (parents.length !== parentIds.length) {
        return NextResponse.json(
          { error: "Beberapa orang tua tidak ditemukan atau bukan role parent" },
          { status: 404 }
        )
      }
    }

    // Create student
    const [newStudent] = await db
      .insert(students)
      .values({
        fullName,
        birthDate: birthDate || null,
        gender,
        classroomId: classroomId || null,
      })
      .returning()

    // Assign parents if provided
    if (parentIds && parentIds.length > 0) {
      await db
        .insert(parentChild)
        .values(
          parentIds.map((parentId: string) => ({
            parentId,
            childId: newStudent.id,
          }))
        )
    }

    return NextResponse.json(newStudent, { status: 201 })
  } catch (error) {
    console.error("Error creating student:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
