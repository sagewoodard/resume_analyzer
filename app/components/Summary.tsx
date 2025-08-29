import ScoreGauge from "app/components/ScoreGauge";
import ScoreBadge from "app/components/ScoreBadge";

type ScoreField = { score?: number };
type Feedback = {
  overallScore?: number;
  toneAndStyle?: ScoreField;
  content?: ScoreField;
  structure?: ScoreField;
  skills?: ScoreField;
  ATS?: { score?: number; tips?: string[] };
  // keep flexible for extra fields
  [k: string]: any;
};

const Category = ({ title, score }: { title: string; score: number }) => {
  const textColor =
    score > 70 ? "text-green-600" : score > 49 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="resume-summary">
      <div className="category">
        <div className="flex flex-row gap-2 items-center justify-center">
          <p className="text-2xl">{title}</p>
          <ScoreBadge score={score} />
        </div>
        <p className="text-2xl">
          <span className={textColor}>{score}</span>/100
        </p>
      </div>
    </div>
  );
};

function num(val: unknown, fallback = 0): number {
  return typeof val === "number" && Number.isFinite(val) ? val : fallback;
}
function fieldScore(f?: ScoreField, fallback = 0): number {
  return num(f?.score, fallback);
}

const Summary = ({ feedback }: { feedback?: Feedback | null }) => {
  // Overall: prefer explicit overallScore, else fall back to ATS.score, else 0
  const overall = num(feedback?.overallScore, num(feedback?.ATS?.score, 0));

  const toneAndStyle = fieldScore(feedback?.toneAndStyle, 0);
  const content = fieldScore(feedback?.content, 0);
  const structure = fieldScore(feedback?.structure, 0);
  const skills = fieldScore(feedback?.skills, 0);

  return (
    <div className="bg-white rounded-2xl shadow-md w-full">
      <div className="flex flex-row items-center p-4 gap-8">
        <ScoreGauge score={overall} />
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Your Resume Score</h2>
          <p className="text-sm text-gray-500">
            This score is calculated based on the variables listed below.
          </p>
        </div>
      </div>

      <Category title="Tone & Style" score={toneAndStyle} />
      <Category title="Content" score={content} />
      <Category title="Structure" score={structure} />
      <Category title="Skills" score={skills} />
    </div>
  );
};

export default Summary;