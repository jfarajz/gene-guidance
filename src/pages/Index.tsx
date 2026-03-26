import { OrderProvider, useOrder } from '@/context/OrderContext';
import { AppShell } from '@/components/AppShell';
import { WizardStep } from '@/components/WizardStep';
import { ProviderScreen } from '@/components/ProviderScreen';
import { PatientScreen } from '@/components/PatientScreen';
import { ClinicalScreen } from '@/components/clinical/ClinicalScreen';

function WizardRouter() {
  const { order } = useOrder();

  switch (order.currentStep) {
    case 0: return <ProviderScreen />;
    case 1: return <PatientScreen />;
    case 2: return <ClinicalScreen />;
    case 3: return <WizardStep title="Review" />;
    case 4: return <WizardStep title="Documents" />;
    default: return null;
  }
}

export default function Index() {
  return (
    <OrderProvider>
      <AppShell>
        <WizardRouter />
      </AppShell>
    </OrderProvider>
  );
}
