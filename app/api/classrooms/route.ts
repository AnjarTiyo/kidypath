import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { classrooms, users, classroomTeachers } from "@/lib/db/schema"
import { desc, asc, sql, or, ilike, eq, inArray } from "drizzle-orm"

// GET - List with pagination, search, sorting, filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check authorization (if needed)
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const search = searchParams.get("search") || ""
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Build where conditions
    const conditions = []
    
    if (search) {
      conditions.push(
        or(
          ilike(classrooms.name, `%${search}%`),
          ilike(classrooms.academicYear, `%${search}%`)
        )
      )
    }

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(classrooms)

    if (conditions.length > 0) {
      countQuery.where(sql`${sql.join(conditions, sql` AND `)}`)
    }

    const [{ count }] = await countQuery

    // Build data query
    const dataQueryBuilder = db
      .select({
        id: classrooms.id,
        name: classrooms.name,
        academicYear: classrooms.academicYear,
        createdAt: classrooms.createdAt,
      })
      .from(classrooms)

    // Apply where conditions
    const dataQueryWithWhere = conditions.length > 0 
      ? dataQueryBuilder.where(sql`${sql.join(conditions, sql` AND `)}`)
      : dataQueryBuilder

    // Apply sorting
    const sortColumn = sortBy === "name" ? classrooms.name :
                      sortBy === "academicYear" ? classrooms.academicYear :
                      classrooms.createdAt

    const dataQueryWithSort = sortOrder === "asc"
      ? dataQueryWithWhere.orderBy(asc(sortColumn))
      : dataQueryWithWhere.orderBy(desc(sortColumn))

    // Apply pagination and execute
    const classroomsData = await dataQueryWithSort
      .limit(pageSize)
      .offset((page - 1) * pageSize)

    // Fetch teachers for each classroom
    const classroomIds = classroomsData.map(c => c.id)
    const teachersData = classroomIds.length > 0 
      ? await db
          .select({
            classroomId: classroomTeachers.classroomId,
            teacherId: users.id,
            teacherName: users.fullName,
          })
          .from(classroomTeachers)
          .innerJoin(users, eq(classroomTeachers.teacherId, users.id))
          .where(inArray(classroomTeachers.classroomId, classroomIds))
      : []

    // Map teachers to classrooms
    const data = classroomsData.map(classroom => {
      const teachers = teachersData
        .filter(t => t.classroomId === classroom.id)
        .map(t => ({ id: t.teacherId, name: t.teacherName }))
      
      return {
        ...classroom,
        teachers,
        teacherIds: teachers.map(t => t.id),
      }
    })

    const totalPages = Math.ceil(count / pageSize)

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        totalCount: count,
        totalPages,
      },
    })
  } catch (error) {
    console.error("Error fetching classrooms:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create new classroom
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check authorization
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, academicYear, teacherIds } = body

    // Validation
    if (!name || !academicYear) {
      return NextResponse.json(
        { error: "Name and academic year are required" },
        { status: 400 }
      )
    }

    // Check for duplicates
    const [existing] = await db
      .select()
      .from(classrooms)
      .where(
        sql`${classrooms.name} = ${name} AND ${classrooms.academicYear} = ${academicYear}`
      )
      .limit(1)

    if (existing) {
      return NextResponse.json(
        { error: "Classroom with this name and academic year already exists" },
        { status: 400 }
      )
    }

    // Verify teachers exist if provided
    if (teacherIds && Array.isArray(teacherIds) && teacherIds.length > 0) {
      const teachers = await db
        .select()
        .from(users)
        .where(inArray(users.id, teacherIds))

      if (teachers.length !== teacherIds.length) {
        return NextResponse.json(
          { error: "One or more teachers not found" },
          { status: 400 }
        )
      }

      const nonTeachers = teachers.filter(t => t.role !== "teacher")
      if (nonTeachers.length > 0) {
        return NextResponse.json(
          { error: "One or more selected users are not teachers" },
          { status: 400 }
        )
      }
    }

    // Create classroom
    const [newClassroom] = await db
      .insert(classrooms)
      .values({
        name,
        academicYear,
      })
      .returning()

    // Add teachers to classroom if provided
    if (teacherIds && Array.isArray(teacherIds) && teacherIds.length > 0) {
      await db
        .insert(classroomTeachers)
        .values(
          teacherIds.map(teacherId => ({
            classroomId: newClassroom.id,
            teacherId,
          }))
        )
    }

    return NextResponse.json(newClassroom, { status: 201 })
  } catch (error) {
    console.error("Error creating classroom:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
