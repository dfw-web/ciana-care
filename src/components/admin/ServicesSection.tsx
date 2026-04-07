import { Stethoscope } from "lucide-react";

const ServicesSection = () => (
  <div className="space-y-6">
    <div className="bg-background rounded-xl border border-border shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <Stethoscope className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Services Management</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Services are managed through the service catalog. Visit the{" "}
        <a href="/services" target="_blank" rel="noopener noreferrer" className="text-primary underline">
          Our Services
        </a>{" "}
        page to see all available services and categories.
      </p>
      <p className="text-sm text-muted-foreground">
        To add, edit, or remove services, update the service catalog data. All services are organized into categories including Laboratory Testing, Ultrasound Services, Clinic Partnerships, School Admission Screening, and Employment Screening.
      </p>
    </div>
  </div>
);

export default ServicesSection;
