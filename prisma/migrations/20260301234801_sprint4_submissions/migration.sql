-- AlterTable
ALTER TABLE "forms" ADD COLUMN     "redirect_url" TEXT,
ADD COLUMN     "success_message" TEXT DEFAULT 'Obrigado! Sua resposta foi enviada.',
ADD COLUMN     "webhook_url" TEXT;

-- CreateTable
CREATE TABLE "submissions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "form_id" UUID NOT NULL,
    "form_version_id" UUID NOT NULL,
    "data" JSONB NOT NULL,
    "ip_hash" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "submissions_tenant_id_form_id_idx" ON "submissions"("tenant_id", "form_id");

-- CreateIndex
CREATE INDEX "submissions_tenant_id_created_at_idx" ON "submissions"("tenant_id", "created_at");

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
