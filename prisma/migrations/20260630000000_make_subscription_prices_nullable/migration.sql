ALTER TABLE "public"."subscriptions"
  ALTER COLUMN "actualPrice" DROP NOT NULL,
  ALTER COLUMN "discountedPrice" DROP NOT NULL;
