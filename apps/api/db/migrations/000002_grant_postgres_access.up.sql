-- postgres ユーザーに Cloud SQL Studio での閲覧・管理権限を付与
-- Cloud SQL の postgres は cloudsqlsuperuser だが真の superuser ではないため、
-- IAM SA が作成したテーブルには明示的な GRANT が必要

-- 既存オブジェクトへの権限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- 今後作成されるオブジェクトへの自動権限付与
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
