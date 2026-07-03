import React, { useState } from 'react';
import { Container, Card, Breadcrumb, ProgressBar } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateTenantWithAdmin } from '@/hooks/usePlatformTenants';
import type { WizardFormData, CreateTenantWithAdminResponse } from '@/types';
import Step1TenantData from './Step1TenantData';
import Step2AdminData from './Step2AdminData';
import Step3Logo from './Step3Logo';
import Step4Confirmation from './Step4Confirmation';
import CredentialsShownOnce from '../CredentialsShownOnce';

// ---------------------------------------------------------------------------
// Step metadata
// ---------------------------------------------------------------------------
const STEPS = [
  { label: 'Datos del tenant' },
  { label: 'Administrador' },
  { label: 'Logo' },
  { label: 'Confirmar' },
] as const;

type StepIndex = 1 | 2 | 3 | 4;

// ---------------------------------------------------------------------------
// Default form data — merged across steps
// ---------------------------------------------------------------------------
const initialFormData: WizardFormData = {
  tenant: {
    tenantId: '',
    name: '',
  },
  admin: {
    email: '',
    firstName: '',
    lastName: '',
  },
  logoFile: undefined,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const OnboardingWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const createMut = useCreateTenantWithAdmin();

  const [step, setStep] = useState<StepIndex>(1);
  const [formData, setFormData] = useState<WizardFormData>(initialFormData);
  const [credentials, setCredentials] = useState<CreateTenantWithAdminResponse | null>(null);

  // ---------------------------------------------------------------------------
  // Step handlers
  // ---------------------------------------------------------------------------
  const handleStep1Next = (tenantData: WizardFormData['tenant']) => {
    setFormData((prev) => ({ ...prev, tenant: tenantData }));
    setStep(2);
  };

  const handleStep2Next = (adminData: WizardFormData['admin']) => {
    setFormData((prev) => ({ ...prev, admin: adminData }));
    setStep(3);
  };

  const handleStep3Next = (logoFile?: File) => {
    setFormData((prev) => ({ ...prev, logoFile }));
    setStep(4);
  };

  const handleSubmit = () => {
    createMut.mutate(formData, {
      onSuccess: (data) => {
        setCredentials(data);
      },
    });
  };

  const handleCredentialsClose = () => {
    if (!credentials) return;
    navigate(`/admin/tenants/${credentials.tenant._id}`);
  };

  const progressValue = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <Container style={{ maxWidth: '820px' }}>
      {/* Breadcrumb */}
      <Breadcrumb>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/admin/tenants' }}>
          Tenants
        </Breadcrumb.Item>
        <Breadcrumb.Item active>Nuevo tenant</Breadcrumb.Item>
      </Breadcrumb>

      <h4 className="mb-4">Onboarding de nuevo tenant</h4>

      {/* Progress indicator */}
      <div className="mb-4">
        <div className="d-flex justify-content-between mb-2">
          {STEPS.map((s, idx) => {
            const stepNum = (idx + 1) as StepIndex;
            const isActive = stepNum === step;
            const isDone = stepNum < step;
            return (
              <span
                key={s.label}
                style={{ fontSize: '0.78rem' }}
                className={isActive ? 'fw-bold text-primary' : isDone ? 'text-success' : 'text-muted'}
                aria-current={isActive ? 'step' : undefined}
              >
                {idx + 1}. {s.label}
              </span>
            );
          })}
        </div>
        <ProgressBar
          now={progressValue}
          aria-label={`Paso ${step} de ${STEPS.length}`}
          aria-valuenow={progressValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Step card */}
      <Card className="shadow-sm">
        <Card.Body className="p-4">
          {step === 1 && (
            <Step1TenantData
              defaultValues={formData.tenant}
              onNext={handleStep1Next}
            />
          )}
          {step === 2 && (
            <Step2AdminData
              defaultValues={formData.admin}
              onNext={handleStep2Next}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <Step3Logo
              defaultFile={formData.logoFile}
              onNext={handleStep3Next}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <Step4Confirmation
              formData={formData}
              onBack={() => setStep(3)}
              onSubmit={handleSubmit}
              isSubmitting={createMut.isLoading}
            />
          )}
        </Card.Body>
      </Card>

      {/* Credentials one-time modal — shown after successful create */}
      {credentials && (
        <CredentialsShownOnce
          credentials={credentials}
          onClose={handleCredentialsClose}
          emailSent={credentials.emailSent}
          adminEmail={credentials.admin.email}
        />
      )}
    </Container>
  );
};

export default OnboardingWizardPage;
