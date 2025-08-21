-- CreateTable
CREATE TABLE "public"."students" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "index_number" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "year_of_admission" INTEGER NOT NULL,
    "current_cwa" DECIMAL(5,2),
    "inserted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lecturers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "email" TEXT,
    "department" TEXT,
    "program" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecturers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pairings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "lecturer_id" UUID NOT NULL,
    "paired_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pairings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_index_number_key" ON "public"."students"("index_number");

-- CreateIndex
CREATE UNIQUE INDEX "lecturers_email_key" ON "public"."lecturers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pairings_student_id_key" ON "public"."pairings"("student_id");

-- AddForeignKey
ALTER TABLE "public"."pairings" ADD CONSTRAINT "pairings_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pairings" ADD CONSTRAINT "pairings_lecturer_id_fkey" FOREIGN KEY ("lecturer_id") REFERENCES "public"."lecturers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
