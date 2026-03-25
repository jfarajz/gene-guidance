interface WizardStepProps {
  title: string;
  children?: React.ReactNode;
}

export function WizardStep({ title, children }: WizardStepProps) {
  return (
    <div className="py-8">
      <h1 className="text-2xl font-semibold text-foreground mb-6">{title}</h1>
      {children || (
        <div className="flex items-center justify-center h-48 rounded-lg border border-border bg-muted/30">
          <p className="text-muted-foreground">Coming soon</p>
        </div>
      )}
    </div>
  );
}
