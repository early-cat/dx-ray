export type ResourceCategory = 'Workloads' | 'Networking' | 'Config & Storage' | 'Security & RBAC' | 'Scaling';

export type ResourceKind = 
  | 'Pod' | 'Deployment' | 'StatefulSet' | 'DaemonSet' | 'Job' | 'CronJob'
  | 'Service' | 'Ingress' | 'NetworkPolicy'
  | 'ConfigMap' | 'Secret' | 'PersistentVolume' | 'PersistentVolumeClaim' | 'StorageClass'
  | 'ServiceAccount' | 'Role' | 'ClusterRole' | 'RoleBinding' | 'ClusterRoleBinding'
  | 'HorizontalPodAutoscaler' | 'ResourceQuota' | 'LimitRange';

export interface ResourceMetadata {
  name: string;
  namespace: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
}

export interface K8sResource {
  id: string; // Internal ID for multi-doc
  apiVersion: string;
  kind: ResourceKind;
  metadata: ResourceMetadata;
  spec?: any;
  data?: any;
  stringData?: any;
  type?: string;
  rules?: any[];
  roleRef?: any;
  subjects?: any[];
}
