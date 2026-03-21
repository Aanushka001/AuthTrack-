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
      notification_emails: ['admin@company.com', 'fraud-team@company.com'],
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

  const [activeTab, setActiveTab] = useState('fraud_detection');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (category: keyof SystemSettings, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const addEmail = () => {
    const email = prompt('Enter email address:');
    if (email && email.includes('@')) {
      updateSetting('alerts', 'notification_emails', [
        ...settings.alerts.notification_emails,
        email,
      ]);
    }
  };

  const removeEmail = (email: string) => {
    updateSetting(
      'alerts',
      'notification_emails',
      settings.alerts.notification_emails.filter((e) => e !== email)
    );
  };

  const tabs = [
    { id: 'fraud_detection', label: 'Fraud Detection', icon: Shield },
    { id: 'alerts', label: 'Alerts & Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Key },
    { id: 'integration', label: 'Integration', icon: Globe },
  ];

  const TabContent = () => {
    switch (activeTab) {
      case 'fraud_detection':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Fraud Detection Settings</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Risk Threshold */}
              <div>
                <label htmlFor="risk-threshold" className="block text-sm font-medium text-gray-700 mb-2">
                  Risk Threshold
                </label>
                <input
                  id="risk-threshold"
                  title="Risk Threshold Slider"
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
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>Low (0)</span>
                  <span>
                    Current: {(settings.fraud_detection.risk_threshold * 100).toFixed(0)}%
                  </span>
                  <span>High (100)</span>
                </div>
              </div>

              {/* Auto-Block Threshold */}
              <div>
                <label htmlFor="auto-block-threshold" className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-Block Threshold
                </label>
                <input
                  id="auto-block-threshold"
                  title="Auto Block Threshold Slider"
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

              {/* ML Model Sensitivity */}
              <div>
                <label htmlFor="ml-sensitivity" className="block text-sm font-medium text-gray-700 mb-2">
                  ML Model Sensitivity
                </label>
                <input
                  id="ml-sensitivity"
                  title="Machine Learning Model Sensitivity"
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
          </div>
        );

      case 'alerts':
        return (
          <div>
            <h3>Alerts & Notifications</h3>
            <label htmlFor="alert-frequency" className="block text-sm font-medium text-gray-700">
              Alert Frequency
            </label>
            <select
              id="alert-frequency"
              title="Alert Frequency Selector"
              value={settings.alerts.alert_frequency}
              onChange={(e) => updateSetting('alerts', 'alert_frequency', e.target.value)}
            >
              <option value="immediate">Immediate</option>
              <option value="hourly">Hourly Digest</option>
              <option value="daily">Daily Digest</option>
              <option value="weekly">Weekly Summary</option>
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex space-x-4 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <TabContent />

      <div className="mt-8 flex justify-end space-x-3">
        <button
          onClick={() => setSettings(settings)}
          className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        {saveStatus === 'success' && (
          <span className="text-green-600 text-sm self-center">Settings saved!</span>
        )}
        {saveStatus === 'error' && (
          <span className="text-red-600 text-sm self-center">Failed to save.</span>
        )}
      </div>
    </div>
  );
}
