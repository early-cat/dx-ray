import { K8sResource, ResourceKind } from '../types';

export const generateDefaultResource = (kind: ResourceKind): K8sResource => {
  const base: K8sResource = {
    id: crypto.randomUUID(),
    apiVersion: getApiVersion(kind),
    kind,
    metadata: {
      name: `my-${kind.toLowerCase()}`,
      namespace: 'default',
      labels: { app: `my-${kind.toLowerCase()}` },
      annotations: {},
    },
  };

  switch (kind) {
    case 'Deployment':
      base.spec = {
        replicas: 3,
        selector: { matchLabels: { app: `my-${kind.toLowerCase()}` } },
        template: {
          metadata: { labels: { app: `my-${kind.toLowerCase()}` } },
          spec: {
            containers: [
              {
                name: 'nginx',
                image: 'nginx:1.21.6',
                imagePullPolicy: 'IfNotPresent',
                resources: {
                  limits: { cpu: '100m', memory: '128Mi' },
                  requests: { cpu: '100m', memory: '128Mi' },
                },
                ports: [{ containerPort: 80 }],
              },
            ],
          },
        },
      };
      break;
    case 'Service':
      base.spec = {
        type: 'ClusterIP',
        selector: { app: 'my-app' },
        ports: [{ port: 80, targetPort: 80, protocol: 'TCP' }],
      };
      break;
    case 'Secret':
      base.type = 'Opaque';
      base.data = {
        username: 'YWRtaW4=', // admin
        password: 'cGFzc3dvcmQ=', // password
      };
      break;
    case 'ConfigMap':
      base.data = {
        'config.json': '{\n  "key": "value"\n}',
      };
      break;
    case 'CronJob':
      base.spec = {
        schedule: '*/5 * * * *',
        jobTemplate: {
          spec: {
            template: {
              spec: {
                containers: [
                  {
                    name: 'hello',
                    image: 'busybox',
                    imagePullPolicy: 'IfNotPresent',
                    command: ['/bin/sh', '-c', 'date; echo Hello from the Kubernetes cluster'],
                  },
                ],
                restartPolicy: 'OnFailure',
              },
            },
          },
        },
      };
      break;
    case 'Role':
    case 'ClusterRole':
      base.rules = [
        {
          apiGroups: [''],
          resources: ['pods'],
          verbs: ['get', 'watch', 'list'],
        },
      ];
      break;
    case 'RoleBinding':
    case 'ClusterRoleBinding':
      base.subjects = [
        {
          kind: 'User',
          name: 'jane',
          apiGroup: 'rbac.authorization.k8s.io',
        },
      ];
      base.roleRef = {
        kind: kind === 'RoleBinding' ? 'Role' : 'ClusterRole',
        name: 'pod-reader',
        apiGroup: 'rbac.authorization.k8s.io',
      };
      break;
    // Add other defaults as needed
    default:
      base.spec = {};
  }

  return base;
};

const getApiVersion = (kind: ResourceKind): string => {
  switch (kind) {
    case 'Pod':
    case 'Service':
    case 'ConfigMap':
    case 'Secret':
    case 'PersistentVolume':
    case 'PersistentVolumeClaim':
    case 'ServiceAccount':
    case 'LimitRange':
    case 'ResourceQuota':
      return 'v1';
    case 'Deployment':
    case 'StatefulSet':
    case 'DaemonSet':
      return 'apps/v1';
    case 'Job':
    case 'CronJob':
      return 'batch/v1';
    case 'Ingress':
    case 'NetworkPolicy':
      return 'networking.k8s.io/v1';
    case 'StorageClass':
      return 'storage.k8s.io/v1';
    case 'Role':
    case 'ClusterRole':
    case 'RoleBinding':
    case 'ClusterRoleBinding':
      return 'rbac.authorization.k8s.io/v1';
    case 'HorizontalPodAutoscaler':
      return 'autoscaling/v2';
    default:
      return 'v1';
  }
};
