import { pgTable, uuid, varchar, text, timestamp, date, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'teacher', 'parent', 'curriculum']);
export const developmentScopeEnum = pgEnum('development_scope', [
  'religious_moral',
  'physical_motor',
  'cognitive',
  'language',
  'social_emotional',
  'art'
]);
export const assessmentScoreEnum = pgEnum('assessment_score', ['BB', 'MB', 'BSH', 'BSB']);
export const attendanceTypeEnum = pgEnum('attendance_type', ['check_in', 'check_out']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'sick', 'permission']);
export const moodEnum = pgEnum('mood', ['bahagia', 'sedih', 'marah', 'takut', 'jijik']);

// Tables
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name'),
  email: varchar('email').unique(),
  passwordHash: varchar('password_hash'),
  role: userRoleEnum('role'),
  isCurriculumCoordinator: boolean('is_curriculum_coordinator').default(false), // New field to indicate curriculum coordinator role
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const classrooms = pgTable('classrooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name'),
  academicYear: varchar('academic_year'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const classroomTeachers = pgTable('classroom_teachers', {
  id: uuid('id').primaryKey().defaultRandom(),
  classroomId: uuid('classroom_id').references(() => classrooms.id, { onDelete: 'cascade' }),
  teacherId: uuid('teacher_id').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const students = pgTable('students', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullName: varchar('full_name'),
  classroomId: uuid('classroom_id').references(() => classrooms.id),
  birthDate: date('birth_date'),
  gender: varchar('gender'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const parentChild = pgTable('parent_child', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id').references(() => users.id),
  childId: uuid('child_id').references(() => students.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const activityAgenda = pgTable('activity_agenda', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: date('date'),
  classroomId: uuid('classroom_id').references(() => classrooms.id),
  description: text('description'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const developmentScopes = pgTable('development_scopes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: developmentScopeEnum('name'),
});

export const learningObjectives = pgTable('learning_objectives', {
  id: uuid('id').primaryKey().defaultRandom(),
  scopeId: uuid('scope_id').references(() => developmentScopes.id),
  description: text('description'),
});

export const dailyAssessments = pgTable('daily_assessments', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: date('date'),
  studentId: uuid('student_id').references(() => students.id),
  classroomId: uuid('classroom_id').references(() => classrooms.id),
  summary: text('summary'), // Optional AI-generated summary
  imageUrl: varchar('image_url'), // Optional activity photo stored in object storage
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const assessmentItems = pgTable('assessment_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  dailyAssessmentId: uuid('daily_assessment_id').references(() => dailyAssessments.id, { onDelete: 'cascade' }),
  scopeId: uuid('scope_id').references(() => developmentScopes.id),
  objectiveId: uuid('objective_id').references(() => learningObjectives.id),
  activityContext: text('activity_context'),
  score: assessmentScoreEnum('score'),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const lessonPlans = pgTable('lesson_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  classroomId: uuid('classroom_id').references(() => classrooms.id),
  date: date('date'),
  topic: varchar('topic'), // Main topic/theme of the lesson plan
  subtopic: varchar('subtopic'), // Subtopic of the lesson plan
  code: varchar('code'), // Optional code/identifier for the lesson
  generatedByAi: boolean('generated_by_ai').default(false),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Lesson Plan Items - Each lesson plan has 6 items (one for each development scope)
export const lessonPlanItems = pgTable('lesson_plan_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonPlanId: uuid('lesson_plan_id').references(() => lessonPlans.id, { onDelete: 'cascade' }),
  developmentScope: developmentScopeEnum('development_scope'),
  learningGoal: text('learning_goal'), // The learning objective for this scope
  activityContext: text('activity_context'), // The activity/context to achieve the goal
  generatedByAi: boolean('generated_by_ai').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const weeklyReports = pgTable('weekly_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => students.id),
  weekStart: date('week_start'),
  weekEnd: date('week_end'),
  summaryText: text('summary_text'),
  autoGenerated: boolean('auto_generated'),
  isPublished: boolean('is_published').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const monthlyReports = pgTable('monthly_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => students.id),
  month: integer('month'),
  year: integer('year'),
  summaryText: text('summary_text'),
  autoGenerated: boolean('auto_generated'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const attendances = pgTable('attendances', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }),
  classroomId: uuid('classroom_id').references(() => classrooms.id, { onDelete: 'cascade' }),
  date: date('date'),
  type: attendanceTypeEnum('type'), // check_in or check_out
  status: attendanceStatusEnum('status'), // present, sick, permission
  mood: moodEnum('mood'), // bahagia (sukacita), sedih, marah, takut (cemas), jijik (nullable for sick/permission)
  note: text('note'),
  recordedBy: uuid('recorded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  classroomTeachers: many(classroomTeachers),
  parentChildren: many(parentChild),
  activityAgendas: many(activityAgenda),
  lessonPlans: many(lessonPlans),
  dailyAssessments: many(dailyAssessments),
  semesterTopics: many(semesterTopics),
  monthlyTopics: many(monthlyTopics),
  weeklyTopics: many(weeklyTopics),
}));

export const classroomsRelations = relations(classrooms, ({ many }) => ({
  teachers: many(classroomTeachers),
  students: many(students),
  activityAgendas: many(activityAgenda),
  lessonPlans: many(lessonPlans),
}));

export const activityAgendaRelations = relations(activityAgenda, ({ one }) => ({
  classroom: one(classrooms, {
    fields: [activityAgenda.classroomId],
    references: [classrooms.id],
  }),
  creator: one(users, {
    fields: [activityAgenda.createdBy],
    references: [users.id],
  }),
}));

export const lessonPlansRelations = relations(lessonPlans, ({ one, many }) => ({
  classroom: one(classrooms, {
    fields: [lessonPlans.classroomId],
    references: [classrooms.id],
  }),
  creator: one(users, {
    fields: [lessonPlans.createdBy],
    references: [users.id],
  }),
  items: many(lessonPlanItems),
}));

export const lessonPlanItemsRelations = relations(lessonPlanItems, ({ one }) => ({
  lessonPlan: one(lessonPlans, {
    fields: [lessonPlanItems.lessonPlanId],
    references: [lessonPlans.id],
  }),
}));

export const classroomTeachersRelations = relations(classroomTeachers, ({ one }) => ({
  classroom: one(classrooms, {
    fields: [classroomTeachers.classroomId],
    references: [classrooms.id],
  }),
  teacher: one(users, {
    fields: [classroomTeachers.teacherId],
    references: [users.id],
  }),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  classroom: one(classrooms, {
    fields: [students.classroomId],
    references: [classrooms.id],
  }),
  parentChildren: many(parentChild),
  dailyAssessments: many(dailyAssessments),
  weeklyReports: many(weeklyReports),
  monthlyReports: many(monthlyReports),
  attendances: many(attendances),
}));

export const dailyAssessmentsRelations = relations(dailyAssessments, ({ one, many }) => ({
  student: one(students, {
    fields: [dailyAssessments.studentId],
    references: [students.id],
  }),
  classroom: one(classrooms, {
    fields: [dailyAssessments.classroomId],
    references: [classrooms.id],
  }),
  createdBy: one(users, {
    fields: [dailyAssessments.createdBy],
    references: [users.id],
  }),
  items: many(assessmentItems),
}));

export const assessmentItemsRelations = relations(assessmentItems, ({ one }) => ({
  dailyAssessment: one(dailyAssessments, {
    fields: [assessmentItems.dailyAssessmentId],
    references: [dailyAssessments.id],
  }),
  scope: one(developmentScopes, {
    fields: [assessmentItems.scopeId],
    references: [developmentScopes.id],
  }),
  objective: one(learningObjectives, {
    fields: [assessmentItems.objectiveId],
    references: [learningObjectives.id],
  }),
}));

export const parentChildRelations = relations(parentChild, ({ one }) => ({
  parent: one(users, {
    fields: [parentChild.parentId],
    references: [users.id],
  }),
  child: one(students, {
    fields: [parentChild.childId],
    references: [students.id],
  }),
}));

export const developmentScopesRelations = relations(developmentScopes, ({ many }) => ({
  learningObjectives: many(learningObjectives),
  assessmentItems: many(assessmentItems),
}));

export const learningObjectivesRelations = relations(learningObjectives, ({ one, many }) => ({
  scope: one(developmentScopes, {
    fields: [learningObjectives.scopeId],
    references: [developmentScopes.id],
  }),
  assessmentItems: many(assessmentItems),
}));

export const weeklyReportsRelations = relations(weeklyReports, ({ one }) => ({
  student: one(students, {
    fields: [weeklyReports.studentId],
    references: [students.id],
  }),
}));

export const monthlyReportsRelations = relations(monthlyReports, ({ one }) => ({
  student: one(students, {
    fields: [monthlyReports.studentId],
    references: [students.id],
  }),
}));

export const attendancesRelations = relations(attendances, ({ one }) => ({
  student: one(students, {
    fields: [attendances.studentId],
    references: [students.id],
  }),
  classroom: one(classrooms, {
    fields: [attendances.classroomId],
    references: [classrooms.id],
  }),
  recordedBy: one(users, {
    fields: [attendances.recordedBy],
    references: [users.id],
  }),
}));

// Curriculum tables
export const semesterTopics = pgTable('semester_topics', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title').notNull(),
  description: text('description'),
  academicYear: varchar('academic_year'),
  semesterNumber: integer('semester_number'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const monthlyTopics = pgTable('monthly_topics', {
  id: uuid('id').primaryKey().defaultRandom(),
  semesterTopicId: uuid('semester_topic_id').references(() => semesterTopics.id, { onDelete: 'cascade' }),
  title: varchar('title').notNull(),
  description: text('description'),
  monthNumber: integer('month_number'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const weeklyTopics = pgTable('weekly_topics', {
  id: uuid('id').primaryKey().defaultRandom(),
  monthlyTopicId: uuid('monthly_topic_id').references(() => monthlyTopics.id, { onDelete: 'cascade' }),
  title: varchar('title').notNull(),
  description: text('description'),
  weekNumber: integer('week_number'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const semesterTopicsRelations = relations(semesterTopics, ({ one, many }) => ({
  creator: one(users, {
    fields: [semesterTopics.createdBy],
    references: [users.id],
  }),
  monthlyTopics: many(monthlyTopics),
}));

export const monthlyTopicsRelations = relations(monthlyTopics, ({ one, many }) => ({
  semesterTopic: one(semesterTopics, {
    fields: [monthlyTopics.semesterTopicId],
    references: [semesterTopics.id],
  }),
  creator: one(users, {
    fields: [monthlyTopics.createdBy],
    references: [users.id],
  }),
  weeklyTopics: many(weeklyTopics),
}));

export const weeklyTopicsRelations = relations(weeklyTopics, ({ one }) => ({
  monthlyTopic: one(monthlyTopics, {
    fields: [weeklyTopics.monthlyTopicId],
    references: [monthlyTopics.id],
  }),
  creator: one(users, {
    fields: [weeklyTopics.createdBy],
    references: [users.id],
  }),
}));
