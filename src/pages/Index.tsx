import { OrderProvider, useOrder } from '@/context/OrderContext';
import { AppShell } from '@/components/AppShell';
import { WizardStep } from '@/components/WizardStep';

function WizardRouter() {
  const { order } = useOrder();

  switch (order.currentStep) {
    case 0: return <WizardStep title="Provider" />;
    case 1: return <WizardStep title="Patient" />;
    case 2: return <WizardStep title="Clinical" />;
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
