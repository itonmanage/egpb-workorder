-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'IT_ADMIN', 'ENGINEER_ADMIN', 'USER', 'EXE_AC', 'FB', 'BANQUET', 'FRONT_OFFICE', 'HK', 'HR', 'JURISTIC', 'KITCHEN', 'RSVN_SALE', 'SEC', 'ENG');

-- CreateEnum
CREATE TYPE "ticket_status" AS ENUM ('NEW', 'IN_PROGRESS', 'ON_HOLD', 'DONE', 'CANCEL');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "full_name" TEXT,
    "position" TEXT,
    "department" TEXT,
    "telephone_extension" TEXT,
    "password" TEXT NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "ticket_number" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "department" TEXT,
    "location" TEXT,
    "type_of_damage" TEXT NOT NULL,
    "status" "ticket_status" NOT NULL DEFAULT 'NEW',
    "admin_notes" TEXT,
    "assign_to" TEXT,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_images" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "is_completion" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_views" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_comments" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_activities" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "user_id" UUID,
    "action_type" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engineer_tickets" (
    "id" UUID NOT NULL,
    "ticket_number" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "department" TEXT,
    "location" TEXT,
    "type_of_damage" TEXT NOT NULL,
    "status" "ticket_status" NOT NULL DEFAULT 'NEW',
    "admin_notes" TEXT,
    "information_by" TEXT,
    "assign_to" TEXT,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "engineer_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engineer_ticket_images" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "is_completion" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "engineer_ticket_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engineer_ticket_views" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "engineer_ticket_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engineer_ticket_comments" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "engineer_ticket_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engineer_ticket_activities" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "user_id" UUID,
    "action_type" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "engineer_ticket_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticket_number_key" ON "tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "tickets_user_id_idx" ON "tickets"("user_id");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "tickets_ticket_number_idx" ON "tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "tickets_created_at_idx" ON "tickets"("created_at" DESC);

-- CreateIndex
CREATE INDEX "ticket_images_ticket_id_idx" ON "ticket_images"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_views_user_id_idx" ON "ticket_views"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_views_ticket_id_user_id_key" ON "ticket_views"("ticket_id", "user_id");

-- CreateIndex
CREATE INDEX "ticket_comments_ticket_id_idx" ON "ticket_comments"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_comments_user_id_idx" ON "ticket_comments"("user_id");

-- CreateIndex
CREATE INDEX "ticket_activities_ticket_id_idx" ON "ticket_activities"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "engineer_tickets_ticket_number_key" ON "engineer_tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "engineer_tickets_user_id_idx" ON "engineer_tickets"("user_id");

-- CreateIndex
CREATE INDEX "engineer_tickets_status_idx" ON "engineer_tickets"("status");

-- CreateIndex
CREATE INDEX "engineer_tickets_ticket_number_idx" ON "engineer_tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "engineer_tickets_created_at_idx" ON "engineer_tickets"("created_at" DESC);

-- CreateIndex
CREATE INDEX "engineer_ticket_images_ticket_id_idx" ON "engineer_ticket_images"("ticket_id");

-- CreateIndex
CREATE INDEX "engineer_ticket_views_user_id_idx" ON "engineer_ticket_views"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "engineer_ticket_views_ticket_id_user_id_key" ON "engineer_ticket_views"("ticket_id", "user_id");

-- CreateIndex
CREATE INDEX "engineer_ticket_comments_ticket_id_idx" ON "engineer_ticket_comments"("ticket_id");

-- CreateIndex
CREATE INDEX "engineer_ticket_comments_user_id_idx" ON "engineer_ticket_comments"("user_id");

-- CreateIndex
CREATE INDEX "engineer_ticket_activities_ticket_id_idx" ON "engineer_ticket_activities"("ticket_id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_images" ADD CONSTRAINT "ticket_images_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_views" ADD CONSTRAINT "ticket_views_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_views" ADD CONSTRAINT "ticket_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_activities" ADD CONSTRAINT "ticket_activities_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_activities" ADD CONSTRAINT "ticket_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engineer_tickets" ADD CONSTRAINT "engineer_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engineer_ticket_images" ADD CONSTRAINT "engineer_ticket_images_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "engineer_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engineer_ticket_views" ADD CONSTRAINT "engineer_ticket_views_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "engineer_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engineer_ticket_views" ADD CONSTRAINT "engineer_ticket_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engineer_ticket_comments" ADD CONSTRAINT "engineer_ticket_comments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "engineer_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engineer_ticket_comments" ADD CONSTRAINT "engineer_ticket_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engineer_ticket_activities" ADD CONSTRAINT "engineer_ticket_activities_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "engineer_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engineer_ticket_activities" ADD CONSTRAINT "engineer_ticket_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
