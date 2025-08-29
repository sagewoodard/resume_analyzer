import { type FormEvent, useState } from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "../components/FileUploader";
import { usePuterStore } from "~/lib/puter";
import { useNavigate } from "react-router";
import { convertPdfToImage } from "app/lib/pdf2img";
import { generateUUID } from "app/lib/utils";
import { prepareInstructions } from "../../constants";

const Upload = () => {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (file: File | null) => {
    setFile(file)
  }

  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    setIsProcessing(true);

    try {
      setStatusText('Uploading the file...');
      const uploadedFile = await fs.upload([file]);
      if (!uploadedFile) {
        setStatusText('Error: Failed to upload file');
        return;
      }

      // --- Optional image step (best-effort) ---
      let imagePath: string | null = null;
      try {
        setStatusText('Converting to image (optional)…');
        const imageFile = await convertPdfToImage(file);

        if (imageFile?.file) {
          setStatusText('Uploading the image…');
          const uploadedImage = await fs.upload([imageFile.file]);
          if (uploadedImage?.path) {
            imagePath = uploadedImage.path;
          } else {
            console.warn('Image upload failed; continuing without image.');
            setStatusText('Image upload failed; continuing without image…');
          }
        } else {
          console.warn('Image not created; continuing without image.');
          setStatusText("Couldn't create image; continuing without image…");
        }
      } catch (err) {
        console.error('PDF→image step threw:', err);
        setStatusText('Image step failed; continuing without image…');
        // Intentionally continue
      }

      setStatusText('Preparing data…');
      const uuid = generateUUID();
      const data: any = {
        id: uuid,
        resumePath: uploadedFile.path,
        companyName,
        jobTitle,
        jobDescription,
        feedback: '',
      };
      if (imagePath) data.imagePath = imagePath;

      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      setStatusText('Analyzing…');
      let feedback: any = null;
      try {
        feedback = await ai.feedback(
          uploadedFile.path,
          prepareInstructions({ jobTitle, jobDescription })
        );
      } catch (err) {
        console.error('ai.feedback threw:', err);
      }

      if (!feedback) {
        setStatusText('Error: Failed to analyze resume');
        return;
      }

      const feedbackText =
        typeof feedback.message?.content === 'string'
          ? feedback.message.content
          : feedback.message?.content?.[0]?.text;

      try {
        data.feedback = JSON.parse(feedbackText);
      } catch {
        data.feedback = feedbackText ?? '';
      }

      await kv.set(`resume:${uuid}`, JSON.stringify(data));
      setStatusText(
        imagePath
          ? 'Analysis complete, redirecting...'
          : 'Analysis complete (no image), redirecting...'
      );
      console.log(data);
      navigate(`/resume/${uuid}`);
    } catch (err) {
      console.error(err);
      setStatusText('Unexpected error during analysis');
    }
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget.closest('form');
    if (!form) return;
    const formData = new FormData(form);

    const companyName = formData.get('company-name') as string;
    const jobTitle = formData.get('job-title') as string;
    const jobDescription = formData.get('job-description') as string;

    if (!file) {
      setStatusText('Please upload a resume first.');
      return;
    }

    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  }

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-full" />
            </>
          ) : (
            <h2>Drop your resume for an ATS score and improvement tips</h2>
          )}
          {!isProcessing && (
            <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input type="text" name="company-name" placeholder="Company Name" id="company-name" />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input type="text" name="job-title" placeholder="Job Title" id="job-title" />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea rows={5} name="job-description" placeholder="Job Description" id="job-description" />
              </div>

              <div className="form-div">
                <label htmlFor="uploader">Upload Resume</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              <button className="primary-button" type="submit">
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}
export default Upload