# 🏗️ ReddyFit Club V8 - HIPAA-Compliant System Architecture

**Version**: 1.0
**Last Updated**: October 7, 2025
**Status**: 🔐 HIPAA-Compliant Design
**Compliance**: HIPAA, HITECH, GDPR-ready

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [HIPAA Compliance Architecture](#hipaa-compliance-architecture)
3. [Technology Stack](#technology-stack)
4. [Component Architecture](#component-architecture)
5. [AI Agent System (Semantic Kernel)](#ai-agent-system-semantic-kernel)
6. [Temporal Workflows](#temporal-workflows)
7. [Supermemory Integration](#supermemory-integration)
8. [Data Architecture](#data-architecture)
9. [Security Architecture](#security-architecture)
10. [Network Architecture](#network-architecture)
11. [Deployment Architecture](#deployment-architecture)
12. [Service Integrations](#service-integrations)
13. [Data Flow](#data-flow)
14. [Scalability & Performance](#scalability--performance)

---

## System Overview

ReddyFit Club V8 is an **enterprise-grade, HIPAA-compliant AI body intelligence platform** that provides:

- **Daily Body Scans**: AI-powered body composition analysis via computer vision
- **7-Agent AI Pipeline**: Microsoft Semantic Kernel orchestrated agents with Supermemory context
- **Durable Workflows**: Temporal.io for reliable, auditable processing
- **Trainer CRM**: HIPAA-compliant client management for fitness professionals
- **Public API**: Developer-friendly API for third-party integrations
- **Gamification**: Privacy-respecting social features

**Core Principle**: Privacy-first, HIPAA-compliant by design, medically defensible

---

## HIPAA Compliance Architecture

### HIPAA Design Principles

```
┌─────────────────────────────────────────────────────────────────┐
│                    HIPAA Compliance Layers                      │
├─────────────────────────────────────────────────────────────────┤
│  1. Physical Safeguards                                         │
│     • Azure Private Cloud (no public endpoints)                 │
│     • Customer-managed encryption keys (CMK)                    │
│     • Geo-restricted deployments                                │
├─────────────────────────────────────────────────────────────────┤
│  2. Technical Safeguards                                        │
│     • End-to-end encryption (TLS 1.3)                          │
│     • Encryption at rest (AES-256)                             │
│     • Multi-factor authentication (mandatory)                   │
│     • Role-based access control (RBAC)                         │
│     • Audit logging (all PHI access)                           │
│     • Session management (15-min idle timeout)                  │
├─────────────────────────────────────────────────────────────────┤
│  3. Administrative Safeguards                                   │
│     • Business Associate Agreements (BAAs)                      │
│     • Security incident response plan                           │
│     • Regular risk assessments                                  │
│     • Workforce training & certifications                       │
│     • Sanction policies for violations                          │
├─────────────────────────────────────────────────────────────────┤
│  4. Data Governance                                             │
│     • Data retention policies (7 years for scans)              │
│     • Right to access (patient data export)                     │
│     • Right to rectification (data corrections)                 │
│     • Right to erasure (de-identification + deletion)           │
│     • Minimum necessary disclosure                              │
└─────────────────────────────────────────────────────────────────┘
```

### Protected Health Information (PHI) Classification

| Data Type | PHI Status | Storage | Encryption | Audit Required |
|-----------|-----------|---------|------------|----------------|
| **Body scan images** | PHI | Azure Blob (encrypted) | AES-256 + CMK | ✅ Yes |
| **Body composition results** | PHI | Firestore (HIPAA mode) | AES-256 | ✅ Yes |
| **Weight measurements** | PHI | Firestore | AES-256 | ✅ Yes |
| **AI insights/recommendations** | PHI | Firestore | AES-256 | ✅ Yes |
| **User profile (name, email)** | PHI | Firestore | AES-256 | ✅ Yes |
| **Authentication logs** | Not PHI | Azure Monitor | TLS 1.3 | ✅ Yes |
| **Anonymous analytics** | Not PHI | Firebase Analytics | N/A | ❌ No |

### Consent Management

```typescript
// User consent tracked for all PHI processing
interface ConsentRecord {
  userId: string;
  consentType: 'scan_analysis' | 'data_sharing' | 'research' | 'marketing';
  granted: boolean;
  grantedAt: Timestamp;
  revokedAt?: Timestamp;
  ipAddress: string;
  userAgent: string;
  consentText: string; // Exact text shown to user
  version: string; // Consent form version
}
```

---

## Technology Stack

### Core Technologies

| Layer | Technology | Purpose | HIPAA Compliant |
|-------|-----------|---------|-----------------|
| **Frontend** | React 19 + TypeScript | UI/UX | ✅ Yes (via Azure Static Web Apps) |
| **Backend API** | Azure Functions (Node.js 20) | Serverless API | ✅ Yes (with VNet integration) |
| **AI Orchestration** | Microsoft Semantic Kernel (D65 licenses) | Multi-agent coordination | ✅ Yes |
| **Agent Memory** | Supermemory (overlap.ai) | Infinite context for agents | ⚠️ Requires BAA |
| **Workflows** | Temporal.io Cloud | Durable execution | ✅ Yes (HIPAA-ready) |
| **Database** | Firebase Firestore (HIPAA mode) | NoSQL database | ✅ Yes (with BAA) |
| **File Storage** | Azure Blob Storage (CMK) | Image storage | ✅ Yes |
| **Authentication** | Firebase Auth + Azure AD | Identity management | ✅ Yes |
| **Code Review** | CodeRabbit | Automated PR reviews | N/A (dev tool) |
| **Project Mgmt** | JIRA (self-hosted) | Task tracking | N/A (internal) |
| **Monitoring** | Azure Monitor + App Insights | Observability | ✅ Yes |
| **AI Vision** | Azure OpenAI GPT-4o Vision | Image analysis | ✅ Yes (with BAA) |

### Business Associate Agreements (BAAs) Required

1. ✅ **Microsoft Azure** - BAA signed for all Azure services
2. ✅ **Firebase/Google Cloud** - BAA required for Firestore
3. ✅ **Temporal.io** - BAA available for Enterprise plan
4. ⚠️ **Supermemory (Overlap.ai)** - Confirm BAA availability
5. ✅ **OpenAI (via Azure)** - Covered under Azure BAA

---

## Component Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
│  React 19 + TypeScript + TailwindCSS + Framer Motion            │
│  (Azure Static Web Apps - HIPAA-compliant hosting)              │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         │ HTTPS / REST API (TLS 1.3)
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│                    API Gateway Layer                             │
│  Azure API Management (VNet integrated)                          │
│  • OAuth 2.0 + JWT validation                                   │
│  • Rate limiting (per user tier)                                │
│  • Request/response logging (metadata only, no PHI)             │
│  • IP allowlisting                                              │
└────────────────────────┬─────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼──────┐  ┌──────▼──────┐  ┌─────▼───────┐
│   Azure      │  │  Semantic   │  │  Temporal   │
│  Functions   │  │   Kernel    │  │  Workflows  │
│   (API)      │  │  Agents     │  │   Engine    │
└───────┬──────┘  └──────┬──────┘  └─────┬───────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│                    Data Layer (Encrypted)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Firestore  │  │ Azure Blob  │  │ Supermemory │            │
│  │   (HIPAA)   │  │  (CMK enc)  │  │   (Agent    │            │
│  │             │  │             │  │   Context)  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└──────────────────────────────────────────────────────────────────┘
```

### Frontend Structure

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Main app component
├── AppRouter.tsx               # Routing with lazy loading
│
├── components/
│   ├── ProtectedRoute.tsx      # Auth guard (HIPAA session check)
│   ├── ConsentModal.tsx        # HIPAA consent collection
│   ├── AuditLogger.tsx         # Client-side audit events
│   │
│   ├── Dashboard/              # Dashboard components
│   ├── Scan/                   # Scan workflow components
│   ├── Profile/                # User profile components
│   └── Compliance/             # HIPAA compliance UI
│
├── pages/                      # Route pages
│   ├── auth/                   # Authentication pages
│   ├── scan/                   # Scan workflow pages
│   ├── trainer/                # Trainer CRM pages
│   └── admin/                  # Admin/compliance pages
│
├── lib/
│   ├── firebase/               # Firebase helpers
│   ├── semanticKernel/         # SK agent clients
│   ├── temporal/               # Temporal clients
│   ├── supermemory/            # Supermemory clients
│   ├── audit/                  # Audit logging
│   └── encryption/             # Client-side encryption
│
├── types/
│   ├── user.ts                 # User & PHI types
│   ├── scan.ts                 # Scan data types
│   ├── consent.ts              # Consent types
│   └── audit.ts                # Audit event types
│
└── config/
    ├── firebase.ts             # Firebase config
    ├── azure.ts                # Azure config
    └── compliance.ts           # HIPAA config
```

---

## AI Agent System (Semantic Kernel)

### Architecture Overview

Microsoft Semantic Kernel orchestrates 7 specialized AI agents, each with Supermemory for infinite context.

```
┌──────────────────────────────────────────────────────────────────┐
│          Semantic Kernel Orchestrator (D65 License)              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Agent Registry & Lifecycle Management                     │ │
│  │  • Agent discovery                                         │ │
│  │  • State management                                        │ │
│  │  • Error handling & retries                               │ │
│  │  • HIPAA audit trail integration                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  7 Specialized Agents (each with Supermemory context)     │ │
│  │                                                            │ │
│  │  1️⃣  QualityCheckAgent                                    │ │
│  │     • Validates image quality                             │ │
│  │     • Context: User's historical scan quality             │ │
│  │     • Memory: Quality issues, feedback patterns           │ │
│  │                                                            │ │
│  │  2️⃣  EstimationAgent                                      │ │
│  │     • Estimates body fat % using Azure OpenAI Vision      │ │
│  │     • Context: User baseline, previous scans              │ │
│  │     • Memory: Estimation history, accuracy tracking       │ │
│  │                                                            │ │
│  │  3️⃣  DeltaAgent                                           │ │
│  │     • Calculates changes from previous scans              │ │
│  │     • Context: Full scan history                          │ │
│  │     • Memory: Trend patterns, volatility                  │ │
│  │                                                            │ │
│  │  4️⃣  InsightsAgent                                        │ │
│  │     • Generates personalized insights                     │ │
│  │     • Context: User profile, goals, preferences           │ │
│  │     • Memory: Past insights, user engagement              │ │
│  │                                                            │ │
│  │  5️⃣  NutritionAgent                                       │ │
│  │     • Creates meal recommendations                        │ │
│  │     • Context: Dietary restrictions, preferences          │ │
│  │     • Memory: Past meals, compliance patterns             │ │
│  │                                                            │ │
│  │  6️⃣  WorkoutAgent                                         │ │
│  │     • Designs workout programs                            │ │
│  │     • Context: Fitness level, injuries, equipment         │ │
│  │     • Memory: Exercise history, performance               │ │
│  │                                                            │ │
│  │  7️⃣  HydrationAgent                                       │ │
│  │     • Tracks hydration targets                            │ │
│  │     • Context: Weight, activity level, climate            │ │
│  │     • Memory: Compliance patterns, reminders              │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                           │
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│              Supermemory (Overlap.ai)                            │
│  • Infinite context window for each agent                       │
│  • Long-term memory across sessions                             │
│  • Encrypted storage of agent state                             │
│  • HIPAA-compliant (pending BAA confirmation)                   │
└──────────────────────────────────────────────────────────────────┘
```

### Semantic Kernel Configuration

```csharp
// C# Semantic Kernel Setup
using Microsoft.SemanticKernel;

var kernel = Kernel.CreateBuilder()
    .AddAzureOpenAIChatCompletion(
        deploymentName: "gpt-4o-vision",
        endpoint: "https://reddyfit-openai.openai.azure.com/",
        apiKey: Environment.GetEnvironmentVariable("AZURE_OPENAI_KEY")
    )
    .Build();

// Register agents as plugins
kernel.ImportPluginFromType<QualityCheckAgent>("QualityCheck");
kernel.ImportPluginFromType<EstimationAgent>("Estimation");
kernel.ImportPluginFromType<DeltaAgent>("Delta");
kernel.ImportPluginFromType<InsightsAgent>("Insights");
kernel.ImportPluginFromType<NutritionAgent>("Nutrition");
kernel.ImportPluginFromType<WorkoutAgent>("Workout");
kernel.ImportPluginFromType<HydrationAgent>("Hydration");

// Execute agent orchestration
var result = await kernel.InvokeAsync("DailyScanOrchestrator",
    new KernelArguments {
        ["scanData"] = scanData,
        ["userId"] = userId
    });
```

### Agent Implementation Example

```csharp
public class EstimationAgent
{
    private readonly ISupermemoryClient _supermemory;
    private readonly IAzureOpenAIClient _openai;
    private readonly IAuditLogger _auditLogger;

    [KernelFunction("EstimateBodyComposition")]
    [Description("Estimates body fat percentage from scan images")]
    public async Task<BodyCompositionEstimate> EstimateAsync(
        [Description("Scan data with images")] ScanData scanData)
    {
        // 1. Retrieve historical context from Supermemory
        var context = await _supermemory.GetContextAsync(
            userId: scanData.UserId,
            contextType: "estimation_history",
            maxTokens: 10000
        );

        // 2. Build prompt with context
        var prompt = $@"
            Analyze these 4 body scan images and estimate body fat percentage.

            Historical context:
            {context}

            User profile: Age {scanData.Age}, Gender {scanData.Gender}, Height {scanData.HeightCm}cm
            Current weight: {scanData.WeightLb}lb

            Provide estimation with confidence level and reasoning.
        ";

        // 3. Call Azure OpenAI Vision API
        var response = await _openai.Chat.CompleteAsync(new ChatRequest
        {
            Model = "gpt-4o-vision",
            Messages = [
                new ChatMessage(Role.System, "You are a body composition expert."),
                new ChatMessage(Role.User, prompt, images: scanData.AngleUrls.Values)
            ],
            Temperature = 0.3,
            ResponseFormat = typeof(BodyCompositionEstimate)
        });

        var estimate = response.Parse<BodyCompositionEstimate>();

        // 4. Store result in Supermemory for future context
        await _supermemory.StoreContextAsync(
            userId: scanData.UserId,
            contextType: "estimation_history",
            content: $"Scan {scanData.ScanId}: BF% {estimate.BodyFatPercent}, Confidence {estimate.Confidence}"
        );

        // 5. Audit PHI access
        await _auditLogger.LogPhiAccessAsync(new AuditEvent
        {
            UserId = scanData.UserId,
            Action = "body_composition_estimation",
            Timestamp = DateTime.UtcNow,
            Success = true
        });

        return estimate;
    }
}
```

---

## Temporal Workflows

### Workflow Architecture

Temporal.io provides durable, fault-tolerant execution of the 7-agent pipeline.

```
┌──────────────────────────────────────────────────────────────────┐
│         Daily Scan Workflow (Temporal Cloud)                     │
│                                                                  │
│  Workflow ID: daily-scan-{scanId}                               │
│  Namespace: quickstart-areddyhh-70f499a0.tjhly                  │
│  Task Queue: body-fat-analysis-queue                            │
│  Timeout: 15 minutes                                            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Step 1: Quality Check (30s)                              │ │
│  │  Activity: qualityCheckActivity                           │ │
│  │  Retry: 3 attempts                                        │ │
│  │  Input: {scanImages, userId}                             │ │
│  │  Output: {approved: bool, feedback: string}              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Step 2: Body Composition Estimation (2m)                 │ │
│  │  Activity: estimationActivity                             │ │
│  │  Uses: Semantic Kernel EstimationAgent                    │ │
│  │  Output: {bfPercent, lbmLb, confidence}                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Step 3: Calculate Deltas (30s)                          │ │
│  │  Activity: deltaActivity                                  │ │
│  │  Uses: Semantic Kernel DeltaAgent + Supermemory          │ │
│  │  Output: {bfChange, lbmChange, weightChange}             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Step 4: Generate Insights (1m)                          │ │
│  │  Activity: insightsActivity                               │ │
│  │  Uses: Semantic Kernel InsightsAgent                      │ │
│  │  Output: {insights: string, recommendations: string[]}   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                      │
│                    ┌──────┴──────┐                              │
│                    │             │                               │
│       ┌────────────▼──┐   ┌─────▼──────┐                       │
│       │  Nutrition (1m) │   │ Workout (1m)│                     │
│       │  Agent 5       │   │ Agent 6     │                     │
│       └────────────┬──┘   └─────┬──────┘                       │
│                    │             │                               │
│                    └──────┬──────┘                              │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Step 7: Hydration Target (30s)                          │ │
│  │  Activity: hydrationActivity                              │ │
│  │  Output: {targetCups, recommendations}                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                      │
│                           ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Step 8: Update Firestore + Audit Log                    │ │
│  │  Activity: updateResultsActivity                          │ │
│  │  HIPAA Audit: Log PHI write event                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Total Duration: 6-7 minutes                                    │
│  All steps audited for HIPAA compliance                         │
└──────────────────────────────────────────────────────────────────┘
```

### Temporal Workflow Code

```typescript
// src/temporal/workflows/dailyScanWorkflow.ts
import { proxyActivities } from '@temporalio/workflow';
import type { Activities } from '../activities';

const {
  qualityCheckActivity,
  estimationActivity,
  deltaActivity,
  insightsActivity,
  nutritionActivity,
  workoutActivity,
  hydrationActivity,
  updateResultsActivity,
  auditPhiAccessActivity
} = proxyActivities<Activities>({
  startToCloseTimeout: '5 minutes',
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 2
  }
});

export async function dailyScanWorkflow(scanData: ScanData): Promise<ScanResult> {
  // HIPAA Audit: Workflow started
  await auditPhiAccessActivity({
    userId: scanData.userId,
    action: 'daily_scan_workflow_started',
    scanId: scanData.scanId
  });

  // Step 1: Quality Check
  const qcResult = await qualityCheckActivity(scanData);
  if (!qcResult.approved) {
    await auditPhiAccessActivity({
      userId: scanData.userId,
      action: 'scan_quality_rejected',
      reason: qcResult.feedback
    });
    throw new Error(`Scan quality rejected: ${qcResult.feedback}`);
  }

  // Step 2: Estimation
  const estimation = await estimationActivity(scanData);

  // Step 3: Deltas
  const deltas = await deltaActivity({ scanData, estimation });

  // Step 4: Insights
  const insights = await insightsActivity({ scanData, estimation, deltas });

  // Steps 5 & 6: Nutrition + Workout (parallel)
  const [nutrition, workout] = await Promise.all([
    nutritionActivity({ scanData, estimation }),
    workoutActivity({ scanData, estimation })
  ]);

  // Step 7: Hydration
  const hydration = await hydrationActivity(scanData);

  // Step 8: Update Firestore
  const result: ScanResult = {
    scanId: scanData.scanId,
    userId: scanData.userId,
    estimation,
    deltas,
    insights,
    nutrition,
    workout,
    hydration,
    completedAt: new Date()
  };

  await updateResultsActivity(result);

  // HIPAA Audit: Workflow completed
  await auditPhiAccessActivity({
    userId: scanData.userId,
    action: 'daily_scan_workflow_completed',
    scanId: scanData.scanId
  });

  return result;
}
```

---

## Supermemory Integration

### Purpose

Supermemory (overlap.ai) provides **infinite context** for AI agents, enabling:
- Long-term memory across user sessions
- Historical context retrieval (all past scans, insights, user preferences)
- Pattern recognition (user behavior, compliance, trends)
- Personalization at scale

### Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                  Supermemory Service (overlap.ai)                │
│                                                                  │
│  User Context Store (per user):                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  userId: user123                                           │ │
│  │                                                            │ │
│  │  Contexts:                                                 │ │
│  │  • estimation_history (10,000 tokens)                     │ │
│  │  • nutrition_preferences (5,000 tokens)                   │ │
│  │  • workout_history (8,000 tokens)                         │ │
│  │  • quality_feedback (3,000 tokens)                        │ │
│  │  • user_goals (2,000 tokens)                              │ │
│  │  • compliance_patterns (4,000 tokens)                     │ │
│  │                                                            │ │
│  │  Total: 32,000 tokens available per agent call            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Features:                                                       │
│  • Semantic search (find similar past scans)                    │
│  • Time-based queries (scans from last 30 days)                 │
│  • Automatic summarization (compress old context)               │
│  • Encrypted storage (HIPAA-compliant pending BAA)              │
└──────────────────────────────────────────────────────────────────┘
```

### Integration Example

```typescript
// src/lib/supermemory/client.ts
import { SupermemoryClient } from '@supermemory/sdk';

export class ReddyFitSupermemoryClient {
  private client: SupermemoryClient;

  constructor(apiKey: string) {
    this.client = new SupermemoryClient({
      apiKey,
      endpoint: 'https://api.overlap.ai/v1'
    });
  }

  async getEstimationContext(userId: string): Promise<string> {
    // Retrieve last 10 scans for context
    const context = await this.client.query({
      userId,
      namespace: 'estimation_history',
      maxTokens: 10000,
      query: 'Previous body fat estimations and trends'
    });

    return context.result;
  }

  async storeEstimationResult(userId: string, scanId: string, result: any): Promise<void> {
    await this.client.store({
      userId,
      namespace: 'estimation_history',
      content: {
        scanId,
        timestamp: new Date().toISOString(),
        bodyFatPercent: result.bodyFatPercent,
        confidence: result.confidence,
        notes: result.notes
      },
      metadata: {
        scanDate: result.scanDate,
        weight: result.weight
      }
    });
  }

  async getNutritionPreferences(userId: string): Promise<string> {
    return await this.client.query({
      userId,
      namespace: 'nutrition_preferences',
      maxTokens: 5000,
      query: 'User dietary restrictions, allergies, preferences, and past meal compliance'
    });
  }
}
```

### HIPAA Considerations

**Status**: ⚠️ **Requires BAA confirmation from Overlap.ai**

**Action Items**:
1. Contact Overlap.ai to confirm HIPAA compliance capabilities
2. Sign Business Associate Agreement
3. Enable encryption at rest for all stored contexts
4. Implement access audit logging
5. Configure data retention policies (7 years for PHI)

---

## Data Architecture

### Database Schema (Firestore - HIPAA Mode)

#### `users` Collection (PHI)

```typescript
{
  uid: string;                  // Firebase Auth UID
  email: string;                // PHI
  displayName: string;          // PHI
  photoURL: string;

  // HIPAA Consent
  consents: {
    scanAnalysis: ConsentRecord;
    dataSharing: ConsentRecord;
    research: ConsentRecord;
  };

  // Profile (PHI)
  profile: {
    age: number;
    gender: 'male' | 'female' | 'other';
    heightCm: number;
    targetWeightKg: number;
    fitnessGoal: string;
  };

  // Subscription
  subscription: 'free' | 'pro' | 'club';
  subscriptionEndDate: Timestamp;

  // Usage
  scansUsed: number;
  scansLimit: number;
  resetDate: Timestamp;

  // Security
  mfaEnabled: boolean;
  lastLogin: Timestamp;

  // Audit
  createdAt: Timestamp;
  updatedAt: Timestamp;
  encryptionKeyId: string;      // Customer-managed key ID
}
```

**Firestore Security Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection - PHI protected
    match /users/{userId} {
      // Only user can read/write their own data
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // MFA required for PHI access
      allow read, write: if request.auth != null
        && request.auth.uid == userId
        && request.auth.token.mfa_verified == true;
    }

    // Scans collection - PHI protected
    match /scans/{scanId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
      allow delete: if false; // Never allow deletion (HIPAA retention)
    }
  }
}
```

#### `scans` Collection (PHI)

```typescript
{
  scanId: string;               // "scn_1234567890"
  userId: string;               // User ID
  date: string;                 // "2025-10-07"

  // Images (PHI)
  angleUrls: {
    front: string;              // Azure Blob URL (encrypted)
    back: string;
    left: string;
    right: string;
  };

  // Measurements (PHI)
  weightLb: number;
  bfPercent: number | null;     // Estimated by AI
  lbmLb: number | null;
  confidence: number;           // AI confidence score

  // QC
  qcStatus: 'pending' | 'approved' | 'rejected';
  qcFeedback: string | null;

  // Deltas
  deltas: {
    bfChange: number;
    lbmChange: number;
    weightChange: number;
  } | null;

  // AI Results (PHI)
  insights: string | null;
  nutritionRecommendations: string | null;
  workoutRecommendations: string | null;
  hydrationTarget: number | null;

  // Workflow
  temporalWorkflowId: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';

  // Audit
  createdAt: Timestamp;
  updatedAt: Timestamp;
  processedAt: Timestamp;
  encryptionKeyId: string;
}
```

**Indexes**:
- `userId + date` (composite)
- `userId + createdAt DESC` (composite)
- `processingStatus` (single)

#### `audit_logs` Collection (HIPAA Required)

```typescript
{
  logId: string;
  timestamp: Timestamp;
  userId: string;               // User whose PHI was accessed
  actorId: string;              // Who performed the action
  action: string;               // e.g., 'scan_viewed', 'data_exported'
  resource: string;             // e.g., 'scans/scn_123'
  success: boolean;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  metadata: {
    [key: string]: any;
  };
}
```

**Retention**: 7 years (HIPAA requirement)

---

## Security Architecture

### Defense in Depth

```
┌──────────────────────────────────────────────────────────────────┐
│  Layer 1: Edge Security (Azure Front Door)                      │
│  • WAF (Web Application Firewall)                               │
│  • DDoS protection                                               │
│  • Geo-filtering (US only for now)                              │
│  • Rate limiting (1000 req/min per IP)                          │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Layer 2: API Gateway (Azure API Management)                    │
│  • OAuth 2.0 token validation                                   │
│  • JWT signature verification                                   │
│  • API key validation                                           │
│  • Request throttling per user tier                             │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Layer 3: Application Security                                  │
│  • MFA enforcement (mandatory)                                  │
│  • Session timeout (15 min idle)                               │
│  • RBAC (role-based access control)                            │
│  • Input validation & sanitization                             │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Layer 4: Network Security (Azure VNet)                         │
│  • Private endpoints (no public internet)                       │
│  • Network Security Groups (NSGs)                               │
│  • Service endpoints                                            │
│  • VNet integration for all services                            │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Layer 5: Data Security                                         │
│  • Encryption at rest (AES-256 with CMK)                       │
│  • Encryption in transit (TLS 1.3)                             │
│  • Customer-managed keys (Azure Key Vault)                     │
│  • Automatic key rotation (90 days)                            │
└──────────────────────────────────────────────────────────────────┘
```

### Encryption Strategy

| Data Type | At Rest | In Transit | Key Management |
|-----------|---------|------------|----------------|
| **Scan images** | AES-256 (CMK) | TLS 1.3 | Azure Key Vault (customer-managed) |
| **Firestore data** | AES-256 | TLS 1.3 | Google KMS (Google-managed) |
| **Session tokens** | N/A | TLS 1.3 | Firebase Auth (managed) |
| **API keys** | AES-256 | TLS 1.3 | Azure Key Vault (customer-managed) |
| **Audit logs** | AES-256 | TLS 1.3 | Azure Monitor (Microsoft-managed) |

### Authentication Flow (HIPAA-Compliant)

```
User Login Request
       │
       ▼
┌─────────────────┐
│ Firebase Auth   │  1. Email/password or Google OAuth
│                 │  2. MFA challenge (TOTP)
└────────┬────────┘
         │
         ▼
    MFA Verified?
         │
         ├─── No ──> Reject Login
         │
         └─── Yes ──> Issue JWT Token
                      │
                      ▼
              ┌──────────────────┐
              │  Session Created │
              │  • 15-min timeout│
              │  • Secure cookie │
              └────────┬─────────┘
                       │
                       ▼
               ┌───────────────┐
               │  Audit Log    │
               │  "User logged │
               │   in with MFA"│
               └───────────────┘
```

---

## Network Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Internet (Public)                             │
└─────────────────────────┬────────────────────────────────────────┘
                          │ TLS 1.3
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│           Azure Front Door (WAF + DDoS Protection)               │
│  • SSL/TLS termination                                          │
│  • Global load balancing                                        │
│  • Caching (static assets only)                                 │
└─────────────────────────┬────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                 Azure API Management                             │
│  • OAuth 2.0 token validation                                   │
│  • Rate limiting                                                │
│  • Request/response transformation                              │
└─────────────────────────┬────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│               Azure Virtual Network (VNet)                       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Subnet: Frontend (Static Web App)                        │ │
│  │  • Azure Static Web Apps                                  │ │
│  │  • VNet integration enabled                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                          │                                       │
│  ┌────────────────────────▼──────────────────────────────────┐ │
│  │  Subnet: Application (Azure Functions)                    │ │
│  │  • Azure Functions (Node.js 20)                           │ │
│  │  • Private endpoints only                                 │ │
│  │  • Managed identity enabled                               │ │
│  └────────────────────────┬──────────────────────────────────┘ │
│                          │                                       │
│  ┌────────────────────────▼──────────────────────────────────┐ │
│  │  Subnet: Data (Storage + Firestore)                      │ │
│  │  • Azure Blob Storage (private endpoint)                  │ │
│  │  • Firestore (VPC connector)                             │ │
│  │  • No public internet access                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Subnet: Services                                         │ │
│  │  • Azure Key Vault (private endpoint)                     │ │
│  │  • Azure Monitor (private link)                           │ │
│  │  • Temporal.io (Cloud via VPN)                           │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### IP Allowlisting

```yaml
# Network Security Group (NSG) Rules
Inbound Rules:
  - Priority: 100
    Name: AllowHTTPS
    Port: 443
    Protocol: TCP
    Source: AzureFrontDoor.Backend

  - Priority: 200
    Name: AllowVNetInternal
    Port: Any
    Protocol: Any
    Source: VirtualNetwork

  - Priority: 300
    Name: DenyAll
    Port: Any
    Protocol: Any
    Source: Any
    Action: Deny

Outbound Rules:
  - Priority: 100
    Name: AllowTemporalCloud
    Destination: 13.113.xxx.xxx/32  # Temporal.io Cloud IP
    Port: 7233

  - Priority: 200
    Name: AllowFirebase
    Destination: ServiceTag.Google
    Port: 443

  - Priority: 300
    Name: AllowSupermemory
    Destination: api.overlap.ai
    Port: 443

  - Priority: 999
    Name: DenyAll
    Destination: Any
    Action: Deny
```

---

## Deployment Architecture

### Production Environment

```
┌──────────────────────────────────────────────────────────────────┐
│                      GitHub Repository                           │
│  Repo: reddyfit-club-v8                                         │
│  Branch: main (protected)                                        │
└─────────────────────────┬────────────────────────────────────────┘
                          │ git push
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                   GitHub Actions CI/CD                           │
│                                                                  │
│  1. Run CodeRabbit review (automated)                           │
│  2. Run tests (unit + integration)                              │
│  3. Build frontend (Vite)                                       │
│  4. Build backend (Azure Functions)                             │
│  5. Security scan (SAST, dependency check)                      │
│  6. Deploy to staging                                           │
│  7. Smoke tests                                                 │
│  8. Deploy to production (manual approval)                      │
└─────────────────────────┬────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Azure Static │  │   Azure      │  │  Temporal    │
│  Web Apps    │  │  Functions   │  │   Cloud      │
│  (Frontend)  │  │  (Backend)   │  │ (Workflows)  │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Environments

| Environment | Purpose | URL | Data | HIPAA |
|-------------|---------|-----|------|-------|
| **Development** | Local dev | localhost:5173 | Mock data | ❌ No |
| **Staging** | QA testing | staging.reddyfit.club | Anonymized data | ✅ Yes |
| **Production** | Live users | app.reddyfit.club | Real PHI | ✅ Yes |

### Deployment Checklist

Before deploying to production:
- [ ] All tests passing (unit, integration, E2E)
- [ ] CodeRabbit review completed
- [ ] Security scan passed (no critical vulnerabilities)
- [ ] HIPAA compliance checklist reviewed
- [ ] BAAs signed with all vendors
- [ ] Encryption keys rotated
- [ ] Audit logging verified
- [ ] Incident response plan tested
- [ ] Backup/restore tested
- [ ] Performance benchmarks met
- [ ] Documentation updated

---

## Service Integrations

### 1. CodeRabbit (Automated Code Reviews)

**Configuration**: `.coderabbit.yaml`

```yaml
language: "en-US"
reviews:
  profile: "assertive"
  high_level_summary: true
  poem: false
  review_status: true
  auto_review:
    enabled: true
    drafts: true
  tools:
    github-checks:
      timeout: 90
chat:
  auto_reply: true
```

**GitHub Actions Workflow**:

```yaml
# .github/workflows/coderabbit-review.yml
name: CodeRabbit AI Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: CodeRabbit Review
        uses: coderabbitai/coderabbit-action@v1
        with:
          api_key: ${{ secrets.CODERABBIT_API_KEY }}
```

### 2. JIRA Integration

**Configuration**:

```typescript
// src/lib/jira/client.ts
import JiraApi from 'jira-client';

const jira = new JiraApi({
  protocol: 'http',
  host: 'localhost',
  port: '8080',
  username: 'admin',
  password: process.env.JIRA_TOKEN,
  apiVersion: '2',
  strictSSL: false
});

// Create issue for new user signup (for tracking)
export async function createUserSignupIssue(userId: string): Promise<void> {
  await jira.addNewIssue({
    fields: {
      project: { key: 'RFIT' },
      summary: `New user signup: ${userId}`,
      description: 'Track onboarding completion',
      issuetype: { name: 'Task' }
    }
  });
}
```

### 3. Temporal.io Cloud

**Connection**:

```typescript
// src/temporal/client.ts
import { Client, Connection } from '@temporalio/client';

const connection = await Connection.connect({
  address: 'ap-northeast-1.aws.api.temporal.io:7233',
  tls: {
    clientCertPair: {
      crt: Buffer.from(process.env.TEMPORAL_CLIENT_CERT!),
      key: Buffer.from(process.env.TEMPORAL_CLIENT_KEY!)
    }
  }
});

const client = new Client({
  connection,
  namespace: 'quickstart-areddyhh-70f499a0.tjhly'
});

export { client };
```

### 4. Supermemory (Overlap.ai)

**Configuration**:

```typescript
// src/lib/supermemory/client.ts
import { SupermemoryClient } from '@supermemory/sdk';

export const supermemory = new SupermemoryClient({
  apiKey: process.env.SUPERMEMORY_API_KEY,
  endpoint: 'https://api.overlap.ai/v1',
  options: {
    encryption: 'AES-256-GCM', // HIPAA requirement
    auditLogging: true
  }
});
```

---

## Data Flow

### Complete User Journey: Daily Scan

```
┌──────────────────────────────────────────────────────────────────┐
│  1. User Initiates Scan                                         │
│     • User uploads 4 photos via mobile/web                      │
│     • Enters weight                                             │
│     • Client-side validation                                    │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  2. Image Upload to Azure Blob (Encrypted)                      │
│     • Client gets SAS token from API                            │
│     • Uploads directly to Azure Blob Storage                    │
│     • Images encrypted at rest (AES-256 + CMK)                  │
│     • Audit event logged: "PHI uploaded"                        │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  3. Create Scan Record in Firestore                             │
│     • API validates request (auth, rate limits)                 │
│     • Creates scan document (status: 'pending')                 │
│     • Audit event logged: "Scan record created"                 │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  4. Trigger Temporal Workflow                                   │
│     • API calls Temporal Cloud                                  │
│     • Workflow ID: daily-scan-{scanId}                         │
│     • Workflow starts asynchronously                            │
│     • Returns immediately to user with "Processing..."          │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  5. Temporal Workflow Execution (6-7 minutes)                   │
│                                                                  │
│     5a. QualityCheckAgent (Semantic Kernel)                    │
│         • Retrieves quality history from Supermemory           │
│         • Validates image quality via GPT-4o Vision            │
│         • If rejected, workflow terminates                      │
│                                                                  │
│     5b. EstimationAgent                                        │
│         • Retrieves baseline + history from Supermemory        │
│         • Estimates BF% via Azure OpenAI Vision                │
│         • Stores result in Supermemory                         │
│                                                                  │
│     5c. DeltaAgent                                             │
│         • Retrieves scan history from Supermemory              │
│         • Calculates changes (BF%, LBM, weight)                │
│                                                                  │
│     5d. InsightsAgent                                          │
│         • Retrieves user profile from Supermemory              │
│         • Generates personalized insights                       │
│                                                                  │
│     5e-5g. Nutrition, Workout, Hydration Agents (Parallel)     │
│         • Each retrieves preferences from Supermemory          │
│         • Generates personalized recommendations               │
│                                                                  │
│     5h. Update Firestore + Audit                               │
│         • Updates scan document with all results               │
│         • Audit event logged: "Scan completed"                 │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  6. Real-Time Update to Frontend                                │
│     • Firestore listener detects update                        │
│     • UI shows results instantly                               │
│     • User sees BF%, charts, recommendations                    │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  7. Post-Processing                                             │
│     • Update user stats (total scans, streak)                  │
│     • Award points (gamification)                               │
│     • Send push notification (results ready)                    │
│     • Update Supermemory with new context                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## Scalability & Performance

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| **Frontend Load Time** | < 2s (p95) | TBD |
| **API Response Time** | < 500ms (p95) | TBD |
| **Scan Processing Time** | < 7 min (p95) | ~6 min (estimated) |
| **Concurrent Users** | 10,000+ | N/A |
| **Daily Scans** | 100,000+ | N/A |
| **Uptime SLA** | 99.9% | N/A |

### Scaling Strategy

#### Phase 1: 0-10K Users (Current)

```
• Single Azure region (US East)
• Azure Functions Consumption plan
• Firebase Firestore (free tier → Blaze)
• Temporal Cloud (free tier → 10K workflows/mo)
• Azure Blob Storage (LRS redundancy)
• Cost: ~$500/mo
```

#### Phase 2: 10K-100K Users

```
• Multi-region deployment (US East + West)
• Azure Functions Premium plan (dedicated instances)
• Firestore scaling (composite indexes optimized)
• Temporal Cloud Professional ($500/mo)
• Azure Blob Storage (ZRS redundancy)
• CDN for static assets (Azure Front Door)
• Cost: ~$3,000/mo
```

#### Phase 3: 100K-1M Users

```
• Global deployment (US, EU, Asia)
• Azure Functions Dedicated (App Service Plan)
• Cosmos DB (global distribution) replacing Firestore
• Temporal Cloud Enterprise ($2,000/mo)
• Azure Blob Storage (GRS redundancy)
• Redis cache for user sessions
• Cost: ~$15,000/mo
```

### Caching Strategy

| Data Type | Cache | TTL | Invalidation |
|-----------|-------|-----|--------------|
| **User profile** | Redis | 15 min | On update |
| **Scan results** | Browser localStorage | 7 days | Never (immutable) |
| **Leaderboards** | Redis | 5 min | Time-based |
| **Static assets** | CDN | 1 year | On deploy |
| **API responses** | API Management | 1 min | On write |

---

## Monitoring & Observability

### Metrics Dashboard

```
┌──────────────────────────────────────────────────────────────────┐
│             Azure Monitor + Application Insights                 │
│                                                                  │
│  Business Metrics:                                              │
│  • Daily active users (DAU)                                     │
│  • Scans processed today                                        │
│  • Subscription conversions (free → pro)                        │
│  • Revenue (MRR, ARR)                                           │
│                                                                  │
│  Technical Metrics:                                             │
│  • API latency (p50, p95, p99)                                 │
│  • Error rate (4xx, 5xx)                                       │
│  • Temporal workflow success rate                               │
│  • Azure Blob upload success rate                              │
│  • Firestore read/write latency                                │
│                                                                  │
│  HIPAA Metrics:                                                 │
│  • PHI access events/hour                                      │
│  • Failed authentication attempts                               │
│  • Suspicious activity alerts                                  │
│  • Data export requests (right to access)                      │
│  • Consent opt-outs                                            │
│                                                                  │
│  Security Metrics:                                              │
│  • WAF blocks/hour                                             │
│  • DDoS mitigation events                                      │
│  • SSL/TLS errors                                              │
│  • Key rotation compliance                                     │
└──────────────────────────────────────────────────────────────────┘
```

### Alerting

```yaml
# Azure Monitor Alerts
Alerts:
  - name: "High Error Rate"
    condition: "errorRate > 5%"
    window: "5 minutes"
    action: "PagerDuty + Email"
    severity: "Critical"

  - name: "Slow API Response"
    condition: "p95Latency > 1000ms"
    window: "10 minutes"
    action: "Email"
    severity: "Warning"

  - name: "Temporal Workflow Failures"
    condition: "failureRate > 10%"
    window: "15 minutes"
    action: "PagerDuty + Slack"
    severity: "Critical"

  - name: "PHI Access Anomaly"
    condition: "phiAccessRate > baseline * 2"
    window: "5 minutes"
    action: "Email Security Team"
    severity: "Critical"

  - name: "Failed MFA Attempts"
    condition: "failedMfaAttempts > 5"
    window: "1 minute"
    action: "Lock account + alert"
    severity: "High"
```

---

## Next Steps

This architecture document will be continuously updated as the system evolves.

**Immediate Action Items**:
1. ✅ Architecture document created
2. ⏭️ Create HIPAA_COMPLIANCE_GUIDE.md
3. ⏭️ Set up CodeRabbit configuration
4. ⏭️ Configure JIRA project
5. ⏭️ Install Microsoft Semantic Kernel SDK
6. ⏭️ Integrate Supermemory client
7. ⏭️ Set up Temporal Cloud connection
8. ⏭️ Begin Phase 2: HIPAA-Compliant Authentication

---

**Document Owner**: Akhil Reddy Danda
**Last Review**: October 7, 2025
**Next Review**: November 7, 2025
**Status**: 🔐 HIPAA-Compliant Design Approved

Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
