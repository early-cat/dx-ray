import React from 'react';
import { K8sResource } from '../types';
import { MetadataForm } from './forms/MetadataForm';
import { DeploymentForm } from './forms/DeploymentForm';
import { RBACForm } from './forms/RBACForm';
import { SecretForm } from './forms/SecretForm';
import { CronJobForm } from './forms/CronJobForm';
import { GenericSpecForm } from './forms/GenericSpecForm';

interface ResourceFormProps {
  resource: K8sResource;
  onChange: (resource: K8sResource) => void;
}

export const ResourceForm: React.FC<ResourceFormProps> = ({ resource, onChange }) => {
  const handleMetadataChange = (metadata: any) => {
    onChange({ ...resource, metadata });
  };

  const handleSpecChange = (spec: any) => {
    onChange({ ...resource, spec });
  };

  const renderSpecificForm = () => {
    switch (resource.kind) {
      case 'Deployment':
        return <DeploymentForm resource={resource} onChange={onChange} />;
      case 'Role':
      case 'ClusterRole':
        return <RBACForm resource={resource} onChange={onChange} />;
      case 'Secret':
        return <SecretForm resource={resource} onChange={onChange} />;
      case 'CronJob':
        return <CronJobForm resource={resource} onChange={onChange} />;
      default:
        return <GenericSpecForm resource={resource} onChange={onChange} />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{resource.kind} Configuration</h2>
        <p className="text-sm text-zinc-400">Configure the properties for your {resource.kind} resource.</p>
      </div>

      <div className="bg-[#0a0f1c] rounded-xl border border-white/10 shadow-sm overflow-hidden">
        <div className="bg-white/5 px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-zinc-200">Metadata</h3>
        </div>
        <div className="p-6">
          <MetadataForm metadata={resource.metadata} onChange={handleMetadataChange} />
        </div>
      </div>

      <div className="bg-[#0a0f1c] rounded-xl border border-white/10 shadow-sm overflow-hidden">
        <div className="bg-white/5 px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-zinc-200">
            {resource.kind === 'Secret' || resource.kind === 'ConfigMap' ? 'Data' : 'Spec'}
          </h3>
        </div>
        <div className="p-6">
          {renderSpecificForm()}
        </div>
      </div>
    </div>
  );
};
