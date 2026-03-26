
-- Add result_file_path column to patients
ALTER TABLE public.patients ADD COLUMN result_file_path text;

-- Create storage bucket for result files
INSERT INTO storage.buckets (id, name, public) VALUES ('result-files', 'result-files', true);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload result files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'result-files');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete result files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'result-files');

-- Allow public to read result files (they still need the code to find the path)
CREATE POLICY "Public can read result files"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'result-files');
