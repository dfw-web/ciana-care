import { FileText } from "lucide-react";
import { Link } from "react-router-dom";

const PatientPortalStrip = () => (
  <section className="bg-primary/5 border-y border-primary/10">
    <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3 text-center sm:text-left">
        <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground leading-snug">
          <span className="font-semibold text-foreground">Check your lab results anytime.</span>{" "}
          Securely access your current and past test records online.
        </p>
      </div>
      <Link
        to="/check-result"
        className="inline-flex items-center gap-2 shrink-0 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
      >
        <FileText className="h-4 w-4" />
        Check Results
      </Link>
    </div>
  </section>
);

export default PatientPortalStrip;
