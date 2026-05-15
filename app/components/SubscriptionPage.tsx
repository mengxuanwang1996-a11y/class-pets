import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface SubscriptionPageProps {
  onClose: () => void;
  onSubscribe: (plan: string) => void;
}

interface Plan {
  id: string;
  name: string;
  duration: string;
  price: string;
  originalPrice?: string;
  features: string[];
  popular?: boolean;
}

export default function SubscriptionPage({ onClose, onSubscribe }: SubscriptionPageProps) {
  const { t } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');

  const plans: Plan[] = [
    {
      id: 'trial',
      name: t('subscription.trial.name'),
      duration: t('subscription.trial.duration'),
      price: t('subscription.trial.price'),
      features: [
        t('subscription.trial.feature1'),
        t('subscription.trial.feature2'),
        t('subscription.trial.feature3'),
      ]
    },
    {
      id: 'monthly',
      name: t('subscription.monthly.name'),
      duration: t('subscription.monthly.duration'),
      price: t('subscription.monthly.price'),
      features: [
        t('subscription.monthly.feature1'),
        t('subscription.monthly.feature2'),
        t('subscription.monthly.feature3'),
        t('subscription.monthly.feature4'),
      ]
    },
    {
      id: 'quarterly',
      name: t('subscription.quarterly.name'),
      duration: t('subscription.quarterly.duration'),
      price: t('subscription.quarterly.price'),
      originalPrice: t('subscription.quarterly.originalPrice'),
      popular: true,
      features: [
        t('subscription.quarterly.feature1'),
        t('subscription.quarterly.feature2'),
        t('subscription.quarterly.feature3'),
        t('subscription.quarterly.feature4'),
        t('subscription.quarterly.feature5'),
      ]
    },
    {
      id: 'yearly',
      name: t('subscription.yearly.name'),
      duration: t('subscription.yearly.duration'),
      price: t('subscription.yearly.price'),
      originalPrice: t('subscription.yearly.originalPrice'),
      features: [
        t('subscription.yearly.feature1'),
        t('subscription.yearly.feature2'),
        t('subscription.yearly.feature3'),
        t('subscription.yearly.feature4'),
        t('subscription.yearly.feature5'),
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      {/* Header */}
      <div
        className="sticky top-0 bg-card border-b border-border z-10"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <h1 className="text-card-foreground">{t('subscription.title')}</h1>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-muted transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h2
            className="text-4xl font-bold mb-4"
            style={{
              background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {t('subscription.heading')}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t('subscription.subheading')}
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-[var(--radius-2xl)] p-6 transition-all cursor-pointer ${
                selectedPlan === plan.id
                  ? 'bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 border-2 border-[var(--primary)] scale-105'
                  : 'bg-card border-2 border-border hover:border-[var(--primary)]/30'
              } ${plan.popular ? 'lg:scale-105' : ''}`}
              style={{ boxShadow: selectedPlan === plan.id ? 'var(--shadow-xl)' : 'var(--shadow-lg)' }}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div
                    className="px-4 py-1 rounded-full text-white text-xs font-medium"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent) 0%, var(--pet-orange) 100%)'
                    }}
                  >
                    {t('subscription.popular')}
                  </div>
                </div>
              )}

              {/* Plan Name */}
              <h3 className="text-card-foreground font-bold text-xl mb-2">{plan.name}</h3>
              <p className="text-muted-foreground text-sm mb-4">{plan.duration}</p>

              {/* Price */}
              <div className="mb-6">
                {plan.originalPrice && (
                  <div className="text-muted-foreground text-sm line-through mb-1">
                    {plan.originalPrice}
                  </div>
                )}
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-3xl font-bold"
                    style={{
                      background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {plan.price}
                  </span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <svg className="w-5 h-5 text-[var(--success)] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Select Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSubscribe(plan.id);
                }}
                className={`w-full py-3 rounded-[var(--radius-lg)] font-medium transition-all ${
                  selectedPlan === plan.id
                    ? 'text-white hover:opacity-90'
                    : 'border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/5'
                }`}
                style={selectedPlan === plan.id ? {
                  background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)'
                } : {}}
              >
                {plan.id === 'trial' ? t('subscription.startTrial') : t('subscription.subscribe')}
              </button>
            </div>
          ))}
        </div>

        {/* Bottom Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>{t('subscription.guarantee')}</p>
        </div>
      </div>
    </div>
  );
}
