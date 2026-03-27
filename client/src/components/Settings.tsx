import React, { useState } from 'react';
import { Save, RefreshCw, Shield, Bell, Key, Globe } from 'lucide-react';

interface SystemSettings {
  fraud_detection: {
    risk_threshold: number;
    auto_block_threshold: number;
    ml_model_sensitivity: number;
    real_time_scoring: boolean;
    behavioral_analysis: boolean;
  };
  alerts: {
    email_notifications: boolean;
    sms_notifications: boolean;
    webhook_notifications: boolean;
    alert_frequency: string;
    notification_emails: string[];
  };
  security: {
    session_timeout: number;
    max_login_attempts: number;
    require_2fa: boolean;
    api_rate_limiting: boolean;
    encryption_level: string;
  };
  integration: {
    api_endpoints: string[];
    webhook_urls: string[];
    data_retention_days: number;
    batch_processing: boolean;
  };
}

type SettingsCategory = keyof SystemSettings;

export default function Settings() {
  const [settings, setSettings] = useState<SystemSettings>({
    fraud_detection: {
      risk_threshold: 0.7,
      auto_block_threshold: 0.9,
      ml_model_sensitivity: 0.8,
      real_time_scoring: true,
      behavioral_analysis: true,
    },
    alerts: {
      email_notifications: true,
      sms_notifications: false,
      webhook_notifications: true,
      alert_frequency: 'immediate',
      notification_emails: ['admin@company.com'],
    },
    security: {
      session_timeout: 30,
      max_login_attempts: 5,
      require_2fa: true,
      api_rate_limiting: true,
      encryption_level: 'AES-256',
    },
    integration: {
      api_endpoints: ['https://api.company.com/webhooks/fraud'],
      webhook_urls: ['https://company.com/webhook/fraud-alert'],
      data_retention_days: 90,
      batch_processing: false,
    },
  });

  const [activeTab, setActiveTab] = useState<SettingsCategory>('fraud_detection');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const updateSetting = <
    C extends SettingsCategory,
    K extends keyof SystemSettings[C]
  >(
    category: C,
    key: K,
    value: SystemSettings[C][K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      setSaveStatus('success');
    } catch {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const tabs: { id: SettingsCategory; label: string; icon: React.ElementType }[] = [
    { id: 'fraud_detection', label: 'Fraud Detection', icon: Shield },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'security', label: 'Security', icon: Key },
    { id: 'integration', label: 'Integration', icon: Globe },
  ];

  const TabContent = () => {
    switch (activeTab) {
      case 'fraud_detection':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Fraud Detection Settings</h3>

            {/* Risk Threshold */}
            <div>
              <label htmlFor="risk-threshold" className="block text-sm font-medium mb-2">
                Risk Threshold
              </label>
              <input
                id="risk-threshold"
                aria-label="Risk Threshold"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.fraud_detection.risk_threshold}
                onChange={(e) =>
                  updateSetting('fraud_detection', 'risk_threshold', parseFloat(e.target.value))
                }
                className="w-full"
              />
              <div className="text-sm mt-1">
                {(settings.fraud_detection.risk_threshold * 100).toFixed(0)}%
              </div>
            </div>

            {/* Auto Block */}
            <div>
              <label htmlFor="auto-block" className="block text-sm font-medium mb-2">
                Auto-Block Threshold
              </label>
              <input
                id="auto-block"
                aria-label="Auto Block Threshold"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.fraud_detection.auto_block_threshold}
                onChange={(e) =>
                  updateSetting(
                    'fraud_detection',
                    'auto_block_threshold',
                    parseFloat(e.target.value)
                  )
                }
                className="w-full"
              />
            </div>

            {/* ML Sensitivity */}
            <div>
              <label htmlFor="ml-sensitivity" className="block text-sm font-medium mb-2">
                ML Model Sensitivity
              </label>
              <input
                id="ml-sensitivity"
                aria-label="ML Model Sensitivity"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.fraud_detection.ml_model_sensitivity}
                onChange={(e) =>
                  updateSetting(
                    'fraud_detection',
                    'ml_model_sensitivity',
                    parseFloat(e.target.value)
                  )
                }
                className="w-full"
              />
            </div>
          </div>
        );

      case 'alerts':
        return (
          <div>
            <h3 className="text-lg font-medium mb-4">Alerts</h3>

            <label htmlFor="alert-frequency" className="block text-sm font-medium mb-2">
              Alert Frequency
            </label>
            <select
              id="alert-frequency"
              aria-label="Alert Frequency"
              value={settings.alerts.alert_frequency}
              onChange={(e) =>
                updateSetting('alerts', 'alert_frequency', e.target.value)
              }
              className="border p-2 rounded w-full"
            >
              <option value="immediate">Immediate</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Tabs */}
      <div className="flex space-x-4 border-b mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <TabContent />

      {/* Actions */}
      <div className="mt-8 flex justify-end space-x-3">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center px-4 py-2 bg-gray-200 rounded-lg"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>

        {saveStatus === 'success' && (
          <span className="text-green-600 self-center">Saved!</span>
        )}
        {saveStatus === 'error' && (
          <span className="text-red-600 self-center">Error saving</span>
        )}
      </div>
    </div>
  );
}