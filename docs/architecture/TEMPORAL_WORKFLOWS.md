# ⏱️ Temporal.io Workflows - ReddyFit Club V8

**Service**: Temporal.io Cloud
**Endpoint**: `ap-northeast-1.aws.api.temporal.io:7233`
**Namespace**: `quickstart-areddyhh-70f499a0.tjhly`
**Task Queue**: `body-fat-analysis-queue`
**Status**: ✅ Cloud account active, ready for integration

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Why Temporal?](#why-temporal)
3. [Architecture](#architecture)
4. [Daily Scan Workflow](#daily-scan-workflow)
5. [Implementation Guide](#implementation-guide)
6. [Activities (Semantic Kernel Agents)](#activities-semantic-kernel-agents)
7. [Error Handling & Retries](#error-handling--retries)
8. [HIPAA Compliance](#hipaa-compliance)
9. [Monitoring & Observability](#monitoring--observability)
10. [Production Deployment](#production-deployment)

---

## Overview

**Temporal.io** is a durable workflow orchestration platform that ensures **reliable, fault-tolerant execution** of long-running processes.

### Key Benefits for ReddyFit

- **Durable Execution**: Workflows survive server crashes, network failures
- **Automatic Retries**: Failed activities automatically retry with exponential backoff
- **HIPAA Audit Trail**: Every step logged with timestamps, actors, results
- **Long-Running Workflows**: Our 7-agent pipeline takes ~6-7 minutes (Temporal handles this)
- **State Management**: Workflow state persisted, can resume from any point
- **Visibility**: Web UI to monitor workflow execution in real-time

### Our Use Case

**Daily Scan Workflow** (7 agents):
1. Upload 4 photos + weight → Temporal workflow triggered
2. Workflow orchestrates 7 Semantic Kernel agents sequentially
3. Each agent executes as a Temporal **activity**
4. Results stored in Firestore + Supermemory
5. User notified when complete (~6-7 minutes)

---

## Why Temporal?

### Problem: Long-Running AI Processing

Our scan processing:
- 7 agents × ~1 minute each = **6-7 minutes total**
- HTTP timeouts (most servers timeout at 30-60 seconds)
- If server crashes mid-processing → user loses progress

### Alternative Approaches (Suboptimal)

| Approach | Pros | Cons | Why Not Used |
|----------|------|------|--------------|
| **Serverless Functions** (Azure Functions) | Auto-scaling | 10-min timeout, no durable state | Can't handle 6-7 min workflow reliably |
| **Message Queues** (Azure Service Bus) | Reliable delivery | Manual retry logic, no workflow visibility | Too low-level, need to build orchestration |
| **Kubernetes Jobs** | Full control | Complex setup, no built-in retries | Overkill for our use case |
| **AWS Step Functions** | AWS-native | Vendor lock-in, limited features | We're on Azure |

### Why Temporal Wins

✅ **Cloud-Native** (no infrastructure management)
✅ **Built-in Retries** (exponential backoff, jitter)
✅ **Durable State** (workflow resumes from failure point)
✅ **Audit Trail** (HIPAA-compliant logging)
✅ **Web UI** (real-time monitoring)
✅ **Multi-Language** (TypeScript, C#, Python, Go)
✅ **Production-Ready** (used by Netflix, Uber, Stripe)

---

## Architecture

### High-Level Flow

```
User Uploads Scan
       ↓
Frontend calls API: POST /api/scan/trigger-workflow
       ↓
API starts Temporal Workflow
       ↓
┌──────────────────────────────────────────────────────────────────┐
│            Temporal.io Cloud (Durable Execution)                 │
│                                                                  │
│  Workflow: dailyScanWorkflow                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Step 1: qualityCheckActivity (30s)                       │ │
│  │  ├─ Execute: QualityCheckAgent (Semantic Kernel)          │ │
│  │  ├─ Retry: 3 attempts                                     │ │
│  │  └─ Timeout: 5 minutes                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Step 2: estimationActivity (2m)                          │ │
│  │  └─ Execute: EstimationAgent + Supermemory                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Step 3: deltaActivity (30s)                              │ │
│  │  └─ Execute: DeltaAgent + historical data                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Step 4-7: insights, nutrition, workout, hydration        │ │
│  │  └─ Parallel execution (Steps 5-6 run concurrently)       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Step 8: updateFirestore + auditLog                       │ │
│  │  └─ Save results, send notification                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Total Duration: ~6-7 minutes                                   │
│  Workflow ID: daily-scan-{scanId}                              │
└──────────────────────────────────────────────────────────────────┘
       ↓
Results stored in Firestore
       ↓
User receives push notification
```

### Components

| Component | Purpose | Language |
|-----------|---------|----------|
| **Workflow** | Orchestrates 7 activities | TypeScript |
| **Activities** | Execute Semantic Kernel agents | TypeScript → C# agents |
| **Worker** | Polls for tasks, executes activities | Node.js 20 |
| **Temporal Cloud** | Stores workflow state, manages retries | SaaS |

---

## Daily Scan Workflow

### Workflow Definition

```typescript
// src/temporal/workflows/dailyScanWorkflow.ts
import { proxyActivities, sleep } from '@temporalio/workflow';
import type { Activities } from '../activities';

// Proxy activities (executed by worker)
const {
  qualityCheckActivity,
  estimationActivity,
  deltaActivity,
  insightsActivity,
  nutritionActivity,
  workoutActivity,
  hydrationActivity,
  updateFirestoreActivity,
  sendNotificationActivity,
  auditLogActivity
} = proxyActivities<Activities>({
  startToCloseTimeout: '5 minutes',  // Max time per activity
  retry: {
    initialInterval: '1 second',
    backoffCoefficient: 2,           // Exponential backoff
    maximumAttempts: 3,
    maximumInterval: '30 seconds'
  }
});

export interface ScanWorkflowInput {
  scanId: string;
  userId: string;
  angleUrls: {
    front: string;
    back: string;
    left: string;
    right: string;
  };
  weightLb: number;
  age: number;
  gender: string;
  heightCm: number;
}

export interface ScanWorkflowResult {
  scanId: string;
  estimation: BodyCompositionEstimate;
  deltas: ScanDeltas;
  insights: PersonalizedInsights;
  nutrition: NutritionRecommendations;
  workout: WorkoutRecommendations;
  hydration: HydrationRecommendations;
  completedAt: Date;
}

export async function dailyScanWorkflow(
  input: ScanWorkflowInput
): Promise<ScanWorkflowResult> {
  // Audit: Workflow started
  await auditLogActivity({
    userId: input.userId,
    action: 'daily_scan_workflow_started',
    scanId: input.scanId,
    timestamp: new Date()
  });

  // Step 1: Quality Check (30 seconds)
  console.log(`[Workflow ${input.scanId}] Step 1/7: Quality Check`);
  const qcResult = await qualityCheckActivity({
    scanId: input.scanId,
    userId: input.userId,
    angleUrls: input.angleUrls
  });

  if (!qcResult.approved) {
    // QC failed, abort workflow
    await auditLogActivity({
      userId: input.userId,
      action: 'scan_quality_rejected',
      scanId: input.scanId,
      reason: qcResult.feedback
    });

    throw new Error(`Quality check failed: ${qcResult.feedback}`);
  }

  // Step 2: Body Composition Estimation (2 minutes)
  console.log(`[Workflow ${input.scanId}] Step 2/7: Estimation`);
  const estimation = await estimationActivity({
    scanId: input.scanId,
    userId: input.userId,
    angleUrls: input.angleUrls,
    weightLb: input.weightLb,
    age: input.age,
    gender: input.gender,
    heightCm: input.heightCm
  });

  // Step 3: Calculate Deltas (30 seconds)
  console.log(`[Workflow ${input.scanId}] Step 3/7: Deltas`);
  const deltas = await deltaActivity({
    userId: input.userId,
    currentEstimation: estimation,
    currentWeight: input.weightLb
  });

  // Step 4: Generate Insights (1 minute)
  console.log(`[Workflow ${input.scanId}] Step 4/7: Insights`);
  const insights = await insightsActivity({
    userId: input.userId,
    estimation,
    deltas
  });

  // Steps 5 & 6: Nutrition + Workout (parallel, 1 minute each)
  console.log(`[Workflow ${input.scanId}] Steps 5-6/7: Nutrition + Workout`);
  const [nutrition, workout] = await Promise.all([
    nutritionActivity({ userId: input.userId, estimation }),
    workoutActivity({ userId: input.userId, estimation })
  ]);

  // Step 7: Hydration (30 seconds)
  console.log(`[Workflow ${input.scanId}] Step 7/7: Hydration`);
  const hydration = await hydrationActivity({
    userId: input.userId,
    weightLb: input.weightLb
  });

  // Build result
  const result: ScanWorkflowResult = {
    scanId: input.scanId,
    estimation,
    deltas,
    insights,
    nutrition,
    workout,
    hydration,
    completedAt: new Date()
  };

  // Update Firestore with all results
  await updateFirestoreActivity({
    scanId: input.scanId,
    result
  });

  // Send push notification to user
  await sendNotificationActivity({
    userId: input.userId,
    title: 'Scan Results Ready! 🎉',
    body: `Your body composition analysis is complete. BF%: ${estimation.bodyFatPercent.toFixed(1)}%`
  });

  // Audit: Workflow completed
  await auditLogActivity({
    userId: input.userId,
    action: 'daily_scan_workflow_completed',
    scanId: input.scanId,
    timestamp: new Date()
  });

  console.log(`[Workflow ${input.scanId}] ✅ Completed successfully`);
  return result;
}
```

---

## Implementation Guide

### 1. Setup

#### Install Temporal SDK

```bash
cd C:/Users/akhil/ReddyfitclubV8
npm install @temporalio/client @temporalio/worker @temporalio/workflow @temporalio/activity
```

#### Project Structure

```
src/
├── temporal/
│   ├── workflows/
│   │   └── dailyScanWorkflow.ts
│   ├── activities/
│   │   ├── qualityCheckActivity.ts
│   │   ├── estimationActivity.ts
│   │   ├── deltaActivity.ts
│   │   ├── insightsActivity.ts
│   │   ├── nutritionActivity.ts
│   │   ├── workoutActivity.ts
│   │   ├── hydrationActivity.ts
│   │   ├── updateFirestoreActivity.ts
│   │   └── index.ts
│   ├── client.ts               # Temporal Cloud connection
│   ├── worker.ts               # Background worker process
│   └── config.ts               # Configuration
```

### 2. Temporal Cloud Connection

```typescript
// src/temporal/client.ts
import { Client, Connection } from '@temporalio/client';
import * as fs from 'fs';

export async function getTemporalClient(): Promise<Client> {
  // Read TLS certificates (stored in Azure Key Vault)
  const cert = fs.readFileSync(process.env.TEMPORAL_CLIENT_CERT_PATH!);
  const key = fs.readFileSync(process.env.TEMPORAL_CLIENT_KEY_PATH!);

  // Connect to Temporal Cloud
  const connection = await Connection.connect({
    address: 'ap-northeast-1.aws.api.temporal.io:7233',
    tls: {
      clientCertPair: {
        crt: cert,
        key: key
      }
    }
  });

  const client = new Client({
    connection,
    namespace: 'quickstart-areddyhh-70f499a0.tjhly'
  });

  return client;
}
```

### 3. Start Workflow (API)

```typescript
// API endpoint to trigger workflow
import { getTemporalClient } from './temporal/client';
import { dailyScanWorkflow } from './temporal/workflows/dailyScanWorkflow';

export async function triggerDailyScan(scanData: ScanData): Promise<string> {
  const client = await getTemporalClient();

  // Start workflow
  const handle = await client.workflow.start(dailyScanWorkflow, {
    taskQueue: 'body-fat-analysis-queue',
    workflowId: `daily-scan-${scanData.scanId}`,  // Unique per scan
    args: [{
      scanId: scanData.scanId,
      userId: scanData.userId,
      angleUrls: scanData.angleUrls,
      weightLb: scanData.weightLb,
      age: scanData.age,
      gender: scanData.gender,
      heightCm: scanData.heightCm
    }]
  });

  console.log(`Started workflow: ${handle.workflowId}`);
  return handle.workflowId;
}
```

### 4. Worker Process

```typescript
// src/temporal/worker.ts
import { Worker } from '@temporalio/worker';
import * as activities from './activities';

async function runWorker() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'body-fat-analysis-queue',
    namespace: 'quickstart-areddyhh-70f499a0.tjhly',
    connection: await getTemporalConnection()
  });

  console.log('🚀 Worker started, polling for tasks...');
  await worker.run();
}

runWorker().catch((err) => {
  console.error('Worker failed:', err);
  process.exit(1);
});
```

**Run worker**:
```bash
# Development
npm run worker

# Production (Azure Container Instance or App Service)
node dist/temporal/worker.js
```

---

## Activities (Semantic Kernel Agents)

Each activity wraps a Semantic Kernel agent call.

### Example: EstimationActivity

```typescript
// src/temporal/activities/estimationActivity.ts
import { getSemanticKernelClient } from '../../lib/semanticKernel';

export interface EstimationActivityInput {
  scanId: string;
  userId: string;
  angleUrls: Record<string, string>;
  weightLb: number;
  age: number;
  gender: string;
  heightCm: number;
}

export async function estimationActivity(
  input: EstimationActivityInput
): Promise<BodyCompositionEstimate> {
  console.log(`[EstimationActivity] Starting for scan ${input.scanId}`);

  try {
    // Get Semantic Kernel client
    const kernel = await getSemanticKernelClient();

    // Execute EstimationAgent
    const estimationPlugin = kernel.plugins.get('Estimation');
    const estimateFunction = estimationPlugin.get('EstimateBodyComposition');

    const result = await kernel.invokeAsync<BodyCompositionEstimate>(
      estimateFunction,
      {
        scanData: input
      }
    );

    console.log(`[EstimationActivity] ✅ Completed: BF% ${result.bodyFatPercent}`);
    return result;
  } catch (error) {
    console.error(`[EstimationActivity] ❌ Failed:`, error);
    throw error;  // Temporal will retry
  }
}
```

### All Activities

```typescript
// src/temporal/activities/index.ts
export { qualityCheckActivity } from './qualityCheckActivity';
export { estimationActivity } from './estimationActivity';
export { deltaActivity } from './deltaActivity';
export { insightsActivity } from './insightsActivity';
export { nutritionActivity } from './nutritionActivity';
export { workoutActivity } from './workoutActivity';
export { hydrationActivity } from './hydrationActivity';
export { updateFirestoreActivity } from './updateFirestoreActivity';
export { sendNotificationActivity } from './sendNotificationActivity';
export { auditLogActivity } from './auditLogActivity';

export type Activities = typeof import('./index');
```

---

## Error Handling & Retries

### Retry Policy

```typescript
// Default retry policy for all activities
{
  initialInterval: '1 second',      // First retry after 1s
  backoffCoefficient: 2,             // Double interval each retry
  maximumAttempts: 3,                // Max 3 total attempts
  maximumInterval: '30 seconds'      // Cap retry interval at 30s
}

// Example retry timeline:
// Attempt 1: Fails → wait 1s
// Attempt 2: Fails → wait 2s (1s × 2)
// Attempt 3: Fails → workflow fails
```

### Custom Retry for Specific Activities

```typescript
// Estimation activity needs longer retries (Azure OpenAI can be slow)
const { estimationActivity } = proxyActivities<Activities>({
  startToCloseTimeout: '10 minutes',  // Longer timeout
  retry: {
    initialInterval: '5 seconds',
    maximumAttempts: 5,  // More retries
    nonRetryableErrorTypes: ['InvalidImageError']  // Don't retry these
  }
});
```

### Error Types

```typescript
// src/lib/errors.ts
export class InvalidImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidImageError';
  }
}

export class InsufficientCreditsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientCreditsError';
  }
}

// In activity:
if (imageQualityTooLow) {
  throw new InvalidImageError('Image quality below threshold');
  // Temporal will NOT retry (nonRetryableErrorTypes)
}
```

### Compensating Actions

```typescript
// If workflow fails mid-way, clean up resources
export async function dailyScanWorkflow(input: ScanWorkflowInput) {
  try {
    // ... main workflow logic
  } catch (error) {
    // Compensate: delete uploaded images if workflow fails
    await deleteImagesActivity({
      scanId: input.scanId,
      angleUrls: input.angleUrls
    });

    // Refund user's scan credit
    await refundScanCreditActivity({
      userId: input.userId,
      scanId: input.scanId
    });

    throw error;
  }
}
```

---

## HIPAA Compliance

### Audit Trail

Temporal automatically logs:
- Workflow start time
- Each activity execution (start, end, result)
- Retries and failures
- Workflow completion

**All logs immutable** (HIPAA requirement ✅)

### Access Control

```typescript
// Only authenticated users can start workflows
export async function triggerDailyScan(
  scanData: ScanData,
  userId: string
): Promise<string> {
  // Verify user owns this scan
  if (scanData.userId !== userId) {
    throw new UnauthorizedException('Cannot start workflow for another user');
  }

  // Check user consent
  const consent = await getUserConsent(userId, 'scan_analysis');
  if (!consent.granted) {
    throw new Error('User has not consented to scan analysis');
  }

  // Start workflow...
}
```

### Data Retention

```typescript
// Temporal Cloud retention: 30 days default
// For HIPAA: Export workflow history to Azure Blob Storage (7 years)

// Daily job: Archive old workflow histories
export async function archiveWorkflowHistories() {
  const client = await getTemporalClient();

  // Query completed workflows
  const workflows = await client.workflow.list({
    query: 'WorkflowType="dailyScanWorkflow" AND ExecutionStatus="Completed"'
  });

  for await (const workflow of workflows) {
    // Export history
    const history = await workflow.fetchHistory();

    // Store in Azure Blob (encrypted, immutable)
    await azureBlobClient.uploadBlockBlob(
      'workflow-archives',
      `${workflow.workflowId}.json`,
      JSON.stringify(history)
    );
  }
}
```

---

## Monitoring & Observability

### Temporal Web UI

**URL**: https://cloud.temporal.io

- View all workflows (running, completed, failed)
- Drill into workflow execution (see each activity)
- Replay failed workflows
- Inspect activity inputs/outputs

### Application Insights Integration

```typescript
// src/temporal/activities/estimationActivity.ts
import { TelemetryClient } from 'applicationinsights';

export async function estimationActivity(input: EstimationActivityInput) {
  const startTime = Date.now();
  const telemetry = new TelemetryClient();

  try {
    const result = await executeEstimation(input);

    // Track success
    telemetry.trackMetric({
      name: 'EstimationActivity.Duration',
      value: Date.now() - startTime
    });

    telemetry.trackEvent({
      name: 'EstimationActivity.Success',
      properties: {
        scanId: input.scanId,
        confidence: result.confidence.toString()
      }
    });

    return result;
  } catch (error) {
    // Track failure
    telemetry.trackException({ exception: error as Error });
    throw error;
  }
}
```

### Metrics to Track

```yaml
# Key Metrics
- Workflow Success Rate: 95%+
- Workflow Duration (p95): < 8 minutes
- Activity Retry Rate: < 5%
- Daily Scans Processed: Track trend
- Error Rate by Activity: Identify bottlenecks
```

### Alerts

```yaml
# Azure Monitor Alerts
- name: "High Workflow Failure Rate"
  condition: "failureRate > 10%"
  window: "15 minutes"
  action: "PagerDuty"

- name: "Workflow Duration Spike"
  condition: "p95Duration > 10 minutes"
  window: "30 minutes"
  action: "Email"
```

---

## Production Deployment

### Environment Variables

```bash
# Azure Function App Settings (or Container)
TEMPORAL_ADDRESS=ap-northeast-1.aws.api.temporal.io:7233
TEMPORAL_NAMESPACE=quickstart-areddyhh-70f499a0.tjhly
TEMPORAL_TASK_QUEUE=body-fat-analysis-queue
TEMPORAL_CLIENT_CERT_PATH=/secrets/temporal-client-cert.pem
TEMPORAL_CLIENT_KEY_PATH=/secrets/temporal-client-key.pem
```

### Worker Deployment (Azure Container Instance)

```yaml
# azure-container-instance.yaml
apiVersion: 2021-09-01
location: eastus
name: reddyfit-temporal-worker
properties:
  containers:
    - name: temporal-worker
      properties:
        image: reddyfit.azurecr.io/temporal-worker:latest
        resources:
          requests:
            cpu: 2
            memoryInGB: 4
        environmentVariables:
          - name: TEMPORAL_ADDRESS
            value: ap-northeast-1.aws.api.temporal.io:7233
          - name: TEMPORAL_NAMESPACE
            value: quickstart-areddyhh-70f499a0.tjhly
  osType: Linux
  restartPolicy: Always
```

### Scaling Workers

```typescript
// Run multiple workers for high throughput
const NUM_WORKERS = 5;  // Process 5 scans concurrently

for (let i = 0; i < NUM_WORKERS; i++) {
  await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'body-fat-analysis-queue',
    maxConcurrentActivityExecutionSize: 1  // 1 scan per worker
  });
}
```

---

## Next Steps

1. ✅ Temporal Cloud account active
2. ⏳ Implement workflow definition
3. ⏳ Implement all 7 activities (wrap SK agents)
4. ⏳ Set up worker process
5. ⏳ Test end-to-end (local)
6. ⏳ Deploy worker to Azure Container Instance
7. ⏳ Configure monitoring & alerts
8. ⏳ Load testing (1000+ scans/day)
9. ⏳ Production launch

---

**Document Owner**: Backend Team
**Last Updated**: October 7, 2025
**Status**: Design Complete, Ready for Implementation

**Generated with [Claude Code](https://claude.com/claude-code)**
**Co-Authored-By**: Claude <noreply@anthropic.com>
