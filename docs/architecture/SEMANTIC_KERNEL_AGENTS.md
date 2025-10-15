# 🤖 Microsoft Semantic Kernel Agents - ReddyFit Club V8

**Version**: 1.0
**Last Updated**: October 7, 2025
**License**: D65 (Enterprise)
**Status**: Design Complete, Ready for Implementation

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Why Semantic Kernel?](#why-semantic-kernel)
3. [Architecture](#architecture)
4. [7 Specialized Agents](#7-specialized-agents)
5. [Agent Implementation](#agent-implementation)
6. [Supermemory Integration](#supermemory-integration)
7. [HIPAA Compliance](#hipaa-compliance)
8. [Development Guide](#development-guide)
9. [Testing Strategy](#testing-strategy)
10. [Production Deployment](#production-deployment)

---

## Overview

**Microsoft Semantic Kernel** is an SDK for integrating AI models (like GPT-4o) into applications with built-in orchestration, memory, and plugin capabilities.

### Key Benefits for ReddyFit

- **🔌 Plugin Architecture**: Each agent is a reusable plugin
- **🧠 Memory Management**: Built-in short-term and long-term memory
- **📊 Observability**: Telemetry and logging out of the box
- **🔄 Orchestration**: Sequential and parallel execution of agents
- **🔐 Security**: Secure handling of API keys and credentials
- **📈 Scalability**: Production-ready for enterprise workloads

### Our Implementation

We use **7 specialized agents** orchestrated by Semantic Kernel to process daily body scans:

```
User Uploads 4 Photos + Weight
         ↓
Semantic Kernel Orchestrator
         ↓
┌────────────────────────────────────┐
│  1. QualityCheckAgent              │
│  2. EstimationAgent                │
│  3. DeltaAgent                     │
│  4. InsightsAgent                  │
│  5. NutritionAgent                 │
│  6. WorkoutAgent                   │
│  7. HydrationAgent                 │
└────────────────────────────────────┘
         ↓
Results Stored in Firestore + Supermemory
```

---

## Why Semantic Kernel?

### Alternative Approaches (Not Used)

| Approach | Pros | Cons | Why Not Used |
|----------|------|------|--------------|
| **Custom Orchestration** | Full control | Reinvent the wheel, no observability | Too much boilerplate |
| **LangChain** | Popular, many integrations | Python-first, complex for simple use cases | We're using C#/.NET backend |
| **Direct OpenAI API** | Simple | No orchestration, no memory, manual retry logic | Lacks enterprise features |

### Why Semantic Kernel Wins

✅ **Native .NET SDK** (C# for Azure Functions backend)
✅ **Enterprise-ready** (Microsoft-backed, SOC 2 compliant)
✅ **Built-in memory** (works seamlessly with Supermemory)
✅ **Plugin architecture** (agents are reusable, testable)
✅ **Azure integration** (Azure OpenAI, Key Vault, Monitor)
✅ **HIPAA-friendly** (audit logging, encryption support)

---

## Architecture

### High-Level Flow

```
┌──────────────────────────────────────────────────────────────────┐
│               Semantic Kernel Orchestrator                       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Kernel Configuration                                      │ │
│  │  • Azure OpenAI endpoint                                   │ │
│  │  • Model: gpt-4o-vision                                   │ │
│  │  • Temperature: 0.3 (deterministic)                       │ │
│  │  • Max tokens: 4096                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Planner                                                   │ │
│  │  • Sequential execution (1-7)                             │ │
│  │  • Pass outputs between agents                            │ │
│  │  • Retry logic (3 attempts)                               │ │
│  │  • Timeout handling (5 min per agent)                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Memory Connectors                                         │ │
│  │  • Supermemory (long-term)                                │ │
│  │  • Semantic Memory (short-term, in-process)               │ │
│  │  • Context: User profile, scan history, preferences       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Plugins (7 Agents)                                        │ │
│  │  [Implemented as Kernel Functions]                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Temporal Workflow     │
              │  (wraps SK execution)  │
              └────────────────────────┘
```

### Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Semantic Kernel SDK** | Microsoft.SemanticKernel | 1.x (latest) |
| **AI Model** | Azure OpenAI GPT-4o Vision | 2024-11-20 |
| **Backend Runtime** | .NET 8 / Azure Functions | 8.0 |
| **Memory Store** | Supermemory (overlap.ai) | API v1 |
| **Workflow Engine** | Temporal.io | Cloud |
| **Database** | Firestore | HIPAA mode |

---

## 7 Specialized Agents

### 1. QualityCheckAgent

**Purpose**: Validate image quality before processing

**Inputs**:
- 4 body scan images (front, back, left, right)
- User metadata (gender, age)

**Processing**:
1. Retrieve quality history from Supermemory
2. Use GPT-4o Vision to analyze:
   - Lighting conditions
   - Image clarity
   - Body visibility (full body in frame)
   - Clothing (minimal for accuracy)
3. Provide feedback if rejected

**Outputs**:
```csharp
public class QualityCheckResult
{
    public bool Approved { get; set; }
    public string Feedback { get; set; }
    public Dictionary<string, string> IssuesByAngle { get; set; }
    // Example: { "front": "Good", "back": "Too dark" }
}
```

**Supermemory Context**:
- Past rejections (avoid same mistakes)
- User's historical quality scores
- Common issues for this user

---

### 2. EstimationAgent

**Purpose**: Estimate body fat percentage and lean body mass

**Inputs**:
- 4 body scan images (quality-approved)
- Weight (lb)
- User profile (age, gender, height)

**Processing**:
1. Retrieve baseline + historical scans from Supermemory
2. Use GPT-4o Vision to estimate:
   - Body fat percentage (BF%)
   - Lean body mass (LBM)
   - Visceral fat rating
3. Calculate confidence score
4. Compare with historical trend

**Outputs**:
```csharp
public class BodyCompositionEstimate
{
    public double BodyFatPercent { get; set; }
    public double LeanBodyMassLb { get; set; }
    public int VisceralFatRating { get; set; }  // 1-12 scale
    public double Confidence { get; set; }      // 0-1
    public string Methodology { get; set; }     // "Visual analysis + historical data"
}
```

**Supermemory Context**:
- User's baseline scan (first ever)
- Last 10 scans for trend analysis
- Estimation accuracy history

**Prompt Example**:
```
Analyze these 4 body scan images and estimate body fat percentage.

User profile:
- Age: 32
- Gender: Male
- Height: 178 cm
- Current weight: 180 lb

Historical context from last scan (7 days ago):
- Body fat: 16.2%
- Lean body mass: 151 lb

Provide estimation with confidence level (0-1) and reasoning.
```

---

### 3. DeltaAgent

**Purpose**: Calculate changes from previous scans

**Inputs**:
- Current estimation (from EstimationAgent)
- User ID
- Current weight

**Processing**:
1. Retrieve scan history from Supermemory
2. Calculate deltas:
   - BF% change (current - previous)
   - LBM change
   - Weight change
3. Identify trends (gaining, losing, plateauing)
4. Flag anomalies (sudden large changes)

**Outputs**:
```csharp
public class ScanDeltas
{
    public double BodyFatChange { get; set; }      // e.g., -0.5 (lost 0.5%)
    public double LeanBodyMassChange { get; set; }  // e.g., +2 lb
    public double WeightChange { get; set; }        // e.g., +1.5 lb
    public string Trend { get; set; }              // "gaining_muscle", "losing_fat"
    public bool AnomalyDetected { get; set; }      // true if >5% change
}
```

**Supermemory Context**:
- Full scan history (all time)
- Trend patterns (weekly, monthly)
- Volatility (how much user fluctuates)

---

### 4. InsightsAgent

**Purpose**: Generate personalized insights and recommendations

**Inputs**:
- Body composition estimate
- Deltas
- User profile (goals, preferences)

**Processing**:
1. Retrieve user goals from Supermemory
2. Use GPT-4 to generate insights:
   - Progress towards goal
   - What's working
   - Areas for improvement
   - Motivation boost
3. Personalize based on user history

**Outputs**:
```csharp
public class PersonalizedInsights
{
    public string MainInsight { get; set; }
    // "Great progress! You've lost 2% body fat in 30 days."

    public List<string> Recommendations { get; set; }
    // ["Increase protein to 180g/day", "Add 2 resistance sessions"]

    public string MotivationalMessage { get; set; }
    // "You're on track to reach your goal of 12% BF by December!"

    public Dictionary<string, double> ProgressMetrics { get; set; }
    // { "goal_completion": 0.65, "consistency_score": 0.85 }
}
```

**Supermemory Context**:
- User's fitness goal (lose fat, build muscle, etc.)
- Goal target (e.g., reach 12% BF)
- Past insights engagement (which messages worked)
- User's response to previous advice

---

### 5. NutritionAgent

**Purpose**: Create personalized meal recommendations

**Inputs**:
- Body composition estimate
- Deltas
- User profile (dietary restrictions, allergies)

**Processing**:
1. Retrieve nutrition preferences from Supermemory
2. Calculate macro targets:
   - Calories (based on TDEE + goal)
   - Protein (1g per lb LBM)
   - Carbs & fats (based on preference)
3. Generate meal suggestions
4. Consider past compliance

**Outputs**:
```csharp
public class NutritionRecommendations
{
    public MacroTargets Targets { get; set; }
    public List<MealSuggestion> Meals { get; set; }
    public List<string> Tips { get; set; }
}

public class MacroTargets
{
    public int Calories { get; set; }         // e.g., 2200
    public int ProteinGrams { get; set; }     // e.g., 180
    public int CarbGrams { get; set; }        // e.g., 220
    public int FatGrams { get; set; }         // e.g., 70
}

public class MealSuggestion
{
    public string MealType { get; set; }      // "Breakfast", "Lunch", etc.
    public string Description { get; set; }
    public MacroTargets Macros { get; set; }
}
```

**Supermemory Context**:
- Dietary restrictions (vegan, keto, etc.)
- Allergies (nuts, dairy, etc.)
- Meal preferences (likes chicken, hates fish)
- Past compliance (did user follow previous plans?)

---

### 6. WorkoutAgent

**Purpose**: Design personalized workout programs

**Inputs**:
- Body composition estimate
- Deltas
- User profile (fitness level, injuries, equipment)

**Processing**:
1. Retrieve workout history from Supermemory
2. Design program based on:
   - Goal (strength, hypertrophy, endurance)
   - Available equipment
   - Time commitment
   - Recovery capacity
3. Progressive overload from last program

**Outputs**:
```csharp
public class WorkoutRecommendations
{
    public string ProgramType { get; set; }          // "Hypertrophy", "Strength", etc.
    public int WeeklyFrequency { get; set; }         // e.g., 4 days/week
    public List<WorkoutDay> Days { get; set; }
}

public class WorkoutDay
{
    public string DayName { get; set; }              // "Push Day", "Leg Day"
    public List<Exercise> Exercises { get; set; }
}

public class Exercise
{
    public string Name { get; set; }                 // "Bench Press"
    public int Sets { get; set; }
    public int Reps { get; set; }
    public string RestTime { get; set; }             // "90 seconds"
    public string Notes { get; set; }
}
```

**Supermemory Context**:
- Past workout programs
- Exercise performance (strength gains)
- Injuries (avoid certain movements)
- Equipment access (gym vs. home)
- Time availability

---

### 7. HydrationAgent

**Purpose**: Calculate daily hydration targets

**Inputs**:
- Body weight
- Activity level
- Climate (if available)

**Processing**:
1. Calculate baseline: weight (lb) / 2 = oz of water
2. Adjust for activity: +12 oz per 30 min exercise
3. Adjust for climate: +20% in hot weather
4. Retrieve compliance history from Supermemory

**Outputs**:
```csharp
public class HydrationRecommendations
{
    public int TargetOunces { get; set; }            // e.g., 100 oz
    public int TargetCups { get; set; }              // e.g., 12.5 cups
    public List<string> Tips { get; set; }
    // ["Drink 20oz upon waking", "Keep water bottle at desk"]
}
```

**Supermemory Context**:
- Historical compliance (does user track hydration?)
- Reminders that worked
- Preferred tracking method (cups, bottles, etc.)

---

## Agent Implementation

### Base Agent Class

```csharp
using Microsoft.SemanticKernel;
using ReddyFit.Services;

public abstract class BaseAgent
{
    protected readonly IKernel _kernel;
    protected readonly ISupermemoryClient _supermemory;
    protected readonly IAuditLogger _auditLogger;

    protected BaseAgent(
        IKernel kernel,
        ISupermemoryClient supermemory,
        IAuditLogger auditLogger)
    {
        _kernel = kernel;
        _supermemory = supermemory;
        _auditLogger = auditLogger;
    }

    protected async Task<string> GetUserContext(
        string userId,
        string contextType,
        int maxTokens = 10000)
    {
        return await _supermemory.QueryAsync(new SupermemoryQuery
        {
            UserId = userId,
            Namespace = contextType,
            MaxTokens = maxTokens
        });
    }

    protected async Task StoreContext(
        string userId,
        string contextType,
        string content)
    {
        await _supermemory.StoreAsync(new SupermemoryDocument
        {
            UserId = userId,
            Namespace = contextType,
            Content = content,
            Timestamp = DateTime.UtcNow
        });
    }

    protected async Task LogPhiAccess(
        string userId,
        string action,
        bool success = true)
    {
        await _auditLogger.LogAsync(new AuditEvent
        {
            UserId = userId,
            Action = action,
            Timestamp = DateTime.UtcNow,
            Success = success,
            PhiAccessed = true
        });
    }
}
```

### EstimationAgent Implementation

```csharp
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;

public class EstimationAgent : BaseAgent
{
    public EstimationAgent(
        IKernel kernel,
        ISupermemoryClient supermemory,
        IAuditLogger auditLogger)
        : base(kernel, supermemory, auditLogger)
    {
    }

    [KernelFunction("EstimateBodyComposition")]
    [Description("Estimates body fat percentage from scan images")]
    public async Task<BodyCompositionEstimate> EstimateAsync(
        [Description("Scan data with images")] ScanData scanData)
    {
        // 1. Retrieve historical context from Supermemory
        var context = await GetUserContext(
            scanData.UserId,
            "estimation_history",
            maxTokens: 10000
        );

        // 2. Build prompt
        var prompt = $@"
            Analyze these 4 body scan images and estimate body fat percentage.

            User profile:
            - Age: {scanData.Age}
            - Gender: {scanData.Gender}
            - Height: {scanData.HeightCm} cm
            - Current weight: {scanData.WeightLb} lb

            Historical context:
            {context}

            Provide your estimate in JSON format:
            {{
                ""bodyFatPercent"": <number>,
                ""leanBodyMassLb"": <number>,
                ""visceralFatRating"": <1-12>,
                ""confidence"": <0-1>,
                ""reasoning"": ""<explanation>""
            }}
        ";

        // 3. Call Azure OpenAI Vision API via Semantic Kernel
        var chatCompletion = _kernel.GetRequiredService<IChatCompletionService>();

        var chatHistory = new ChatHistory();
        chatHistory.AddSystemMessage("You are a body composition expert. Analyze images and provide accurate estimates.");
        chatHistory.AddUserMessage(new ChatMessageContent
        {
            Role = AuthorRole.User,
            Items = new List<ChatMessageContentItem>
            {
                new TextContent(prompt),
                new ImageContent(new Uri(scanData.AngleUrls["front"])),
                new ImageContent(new Uri(scanData.AngleUrls["back"])),
                new ImageContent(new Uri(scanData.AngleUrls["left"])),
                new ImageContent(new Uri(scanData.AngleUrls["right"]))
            }
        });

        var settings = new OpenAIPromptExecutionSettings
        {
            Temperature = 0.3,  // More deterministic
            MaxTokens = 1000,
            ResponseFormat = "json_object"
        };

        var response = await chatCompletion.GetChatMessageContentAsync(
            chatHistory,
            settings
        );

        // 4. Parse response
        var estimate = JsonSerializer.Deserialize<BodyCompositionEstimate>(
            response.Content
        );

        // 5. Store result in Supermemory for future context
        await StoreContext(
            scanData.UserId,
            "estimation_history",
            $"Scan {scanData.ScanId} ({scanData.Date}): BF% {estimate.BodyFatPercent}, LBM {estimate.LeanBodyMassLb} lb, Confidence {estimate.Confidence}"
        );

        // 6. Audit PHI access
        await LogPhiAccess(
            scanData.UserId,
            "body_composition_estimation",
            success: true
        );

        return estimate;
    }
}
```

### DeltaAgent Implementation

```csharp
public class DeltaAgent : BaseAgent
{
    [KernelFunction("CalculateDeltas")]
    [Description("Calculates changes from previous scans")]
    public async Task<ScanDeltas> CalculateDeltasAsync(
        [Description("Current estimation")] BodyCompositionEstimate current,
        [Description("User ID")] string userId,
        [Description("Current weight")] double currentWeightLb)
    {
        // 1. Retrieve scan history from Supermemory
        var historyJson = await GetUserContext(
            userId,
            "scan_history",
            maxTokens: 20000
        );

        var scanHistory = JsonSerializer.Deserialize<List<ScanRecord>>(historyJson);

        // 2. Get previous scan (most recent before current)
        var previousScan = scanHistory
            .OrderByDescending(s => s.Date)
            .FirstOrDefault();

        if (previousScan == null)
        {
            // First scan ever, no deltas
            return new ScanDeltas
            {
                BodyFatChange = 0,
                LeanBodyMassChange = 0,
                WeightChange = 0,
                Trend = "baseline",
                AnomalyDetected = false
            };
        }

        // 3. Calculate deltas
        var deltas = new ScanDeltas
        {
            BodyFatChange = current.BodyFatPercent - previousScan.BodyFatPercent,
            LeanBodyMassChange = current.LeanBodyMassLb - previousScan.LeanBodyMassLb,
            WeightChange = currentWeightLb - previousScan.WeightLb
        };

        // 4. Determine trend
        if (deltas.BodyFatChange < -0.5 && deltas.LeanBodyMassChange > 0)
        {
            deltas.Trend = "recomposition";  // Losing fat, gaining muscle
        }
        else if (deltas.BodyFatChange < -0.5)
        {
            deltas.Trend = "cutting";  // Losing fat
        }
        else if (deltas.LeanBodyMassChange > 1)
        {
            deltas.Trend = "bulking";  // Gaining muscle
        }
        else
        {
            deltas.Trend = "maintenance";
        }

        // 5. Anomaly detection (>5% change is suspicious)
        deltas.AnomalyDetected = Math.Abs(deltas.BodyFatChange) > 5;

        // 6. Audit
        await LogPhiAccess(userId, "calculate_deltas");

        return deltas;
    }
}
```

---

## Supermemory Integration

### How Agents Use Supermemory

Each agent has access to **infinite context** via Supermemory:

```csharp
// Retrieve context
var context = await _supermemory.QueryAsync(new SupermemoryQuery
{
    UserId = "user123",
    Namespace = "estimation_history",  // Separate namespace per agent
    Query = "Last 10 body fat estimations and trends",
    MaxTokens = 10000
});

// Store context
await _supermemory.StoreAsync(new SupermemoryDocument
{
    UserId = "user123",
    Namespace = "estimation_history",
    Content = "Scan scn_456: BF% 15.5, Confidence 0.92",
    Metadata = new Dictionary<string, string>
    {
        { "scanId", "scn_456" },
        { "date", "2025-10-07" }
    }
});
```

### Namespace Strategy

| Namespace | Purpose | Example Content |
|-----------|---------|-----------------|
| `estimation_history` | BF% estimations | "Scan scn_123: BF% 16.2, LBM 151lb" |
| `quality_feedback` | Image quality issues | "Front photo too dark 3 times" |
| `nutrition_preferences` | Dietary info | "Vegan, allergic to nuts" |
| `workout_history` | Exercise performance | "Bench press: 185lb x 5 reps" |
| `user_goals` | Fitness targets | "Goal: Reach 12% BF by Dec 2025" |
| `compliance_patterns` | Adherence tracking | "Meal logging 85% compliant" |

### Context Retrieval Example

```csharp
// EstimationAgent needs historical scans
var estimationContext = await _supermemory.QueryAsync(new SupermemoryQuery
{
    UserId = userId,
    Namespace = "estimation_history",
    Query = "User's last 10 body composition estimates",
    MaxTokens = 10000,
    Filters = new Dictionary<string, string>
    {
        { "date_range", "last_90_days" }
    }
});

// Returns:
// "Scan history for user123:
// - 2025-10-01: BF% 16.5, LBM 150lb, Confidence 0.89
// - 2025-09-24: BF% 16.8, LBM 149lb, Confidence 0.91
// - 2025-09-17: BF% 17.2, LBM 148lb, Confidence 0.87
// ..."
```

---

## HIPAA Compliance

### PHI Handling in Agents

All agents process **Protected Health Information (PHI)**. Compliance requirements:

#### 1. Audit Logging

```csharp
// Log ALL PHI access
await _auditLogger.LogAsync(new AuditEvent
{
    EventId = Guid.NewGuid().ToString(),
    Timestamp = DateTime.UtcNow,
    ActorId = "system_agent_estimation",
    ActorType = "system",
    Action = "body_composition_estimation",
    ResourceType = "scan",
    ResourceId = scanId,
    ResourceOwner = userId,
    Success = true,
    PhiAccessed = true,
    PhiTypes = new[] { "scan_images", "body_composition" }
});
```

#### 2. Encryption

- **Azure OpenAI**: TLS 1.3 in transit
- **Supermemory**: AES-256 at rest
- **Firestore**: Google-managed encryption

#### 3. Access Control

```csharp
// Verify user consent before processing
var consent = await GetUserConsent(userId, "scan_analysis");
if (!consent.Granted)
{
    throw new UnauthorizedException("User has not consented to scan analysis");
}
```

#### 4. Data Minimization

```csharp
// Only include necessary PHI in prompts
var prompt = $@"
    Age: {user.Age}  // ✅ Necessary
    Gender: {user.Gender}  // ✅ Necessary
    Email: {user.Email}  // ❌ NOT necessary, exclude
";
```

#### 5. Error Handling

```csharp
try
{
    var estimate = await EstimateAsync(scanData);
}
catch (Exception ex)
{
    // ❌ NEVER expose PHI in error messages
    _logger.LogError(ex, "Estimation failed for scan {ScanId}", scanData.ScanId);

    // ✅ Generic error to user
    throw new ApplicationException("Unable to process scan. Please try again.");
}
```

---

## Development Guide

### Setup (Local Development)

#### 1. Install Semantic Kernel SDK

```bash
# .NET project
dotnet add package Microsoft.SemanticKernel --version 1.x

# Or via NuGet Package Manager
Install-Package Microsoft.SemanticKernel
```

#### 2. Configure Kernel

```csharp
// Program.cs or Startup.cs
using Microsoft.SemanticKernel;

var builder = Kernel.CreateBuilder();

// Add Azure OpenAI service
builder.AddAzureOpenAIChatCompletion(
    deploymentName: "gpt-4o-vision",
    endpoint: "https://reddyfit-openai.openai.azure.com/",
    apiKey: Environment.GetEnvironmentVariable("AZURE_OPENAI_API_KEY")
);

// Add plugins (agents)
builder.Plugins.AddFromType<QualityCheckAgent>("QualityCheck");
builder.Plugins.AddFromType<EstimationAgent>("Estimation");
builder.Plugins.AddFromType<DeltaAgent>("Delta");
builder.Plugins.AddFromType<InsightsAgent>("Insights");
builder.Plugins.AddFromType<NutritionAgent>("Nutrition");
builder.Plugins.AddFromType<WorkoutAgent>("Workout");
builder.Plugins.AddFromType<HydrationAgent>("Hydration");

var kernel = builder.Build();
```

#### 3. Execute Orchestration

```csharp
// Orchestrate all 7 agents sequentially
public async Task<ScanResult> ProcessDailyScan(ScanData scanData)
{
    var kernel = GetConfiguredKernel();

    // Step 1: Quality Check
    var qcFunction = kernel.Plugins["QualityCheck"]["QualityCheck"];
    var qcResult = await kernel.InvokeAsync<QualityCheckResult>(
        qcFunction,
        new KernelArguments { ["scanData"] = scanData }
    );

    if (!qcResult.Approved)
    {
        throw new InvalidOperationException($"Scan rejected: {qcResult.Feedback}");
    }

    // Step 2: Estimation
    var estimationFunction = kernel.Plugins["Estimation"]["EstimateBodyComposition"];
    var estimation = await kernel.InvokeAsync<BodyCompositionEstimate>(
        estimationFunction,
        new KernelArguments { ["scanData"] = scanData }
    );

    // Step 3: Deltas
    var deltaFunction = kernel.Plugins["Delta"]["CalculateDeltas"];
    var deltas = await kernel.InvokeAsync<ScanDeltas>(
        deltaFunction,
        new KernelArguments
        {
            ["current"] = estimation,
            ["userId"] = scanData.UserId,
            ["currentWeightLb"] = scanData.WeightLb
        }
    );

    // Steps 4-7: Insights, Nutrition, Workout, Hydration (similar pattern)
    // ...

    return new ScanResult
    {
        Estimation = estimation,
        Deltas = deltas,
        // ...
    };
}
```

---

## Testing Strategy

### Unit Tests

```csharp
using Xunit;
using Moq;

public class EstimationAgentTests
{
    [Fact]
    public async Task EstimateAsync_ValidScan_ReturnsEstimate()
    {
        // Arrange
        var mockKernel = new Mock<IKernel>();
        var mockSupermemory = new Mock<ISupermemoryClient>();
        var mockAuditLogger = new Mock<IAuditLogger>();

        var agent = new EstimationAgent(
            mockKernel.Object,
            mockSupermemory.Object,
            mockAuditLogger.Object
        );

        var scanData = new ScanData
        {
            UserId = "user123",
            WeightLb = 180,
            Age = 32,
            Gender = "Male",
            HeightCm = 178
        };

        // Mock Supermemory response
        mockSupermemory
            .Setup(s => s.QueryAsync(It.IsAny<SupermemoryQuery>()))
            .ReturnsAsync("Previous scan: BF% 16.5");

        // Mock OpenAI response
        mockKernel
            .Setup(k => k.InvokeAsync<BodyCompositionEstimate>(It.IsAny<KernelFunction>(), It.IsAny<KernelArguments>()))
            .ReturnsAsync(new BodyCompositionEstimate
            {
                BodyFatPercent = 16.2,
                LeanBodyMassLb = 151,
                Confidence = 0.92
            });

        // Act
        var result = await agent.EstimateAsync(scanData);

        // Assert
        Assert.NotNull(result);
        Assert.InRange(result.BodyFatPercent, 5, 50);
        Assert.InRange(result.Confidence, 0, 1);

        // Verify audit logging
        mockAuditLogger.Verify(
            a => a.LogAsync(It.Is<AuditEvent>(e => e.PhiAccessed == true)),
            Times.Once
        );
    }
}
```

### Integration Tests

```csharp
public class AgentOrchestrationTests
{
    [Fact]
    public async Task ProcessDailyScan_EndToEnd_Success()
    {
        // Use real Azure OpenAI (test environment)
        var kernel = GetTestKernel();

        var scanData = new ScanData
        {
            UserId = "test_user_123",
            AngleUrls = new Dictionary<string, string>
            {
                { "front", "https://test-storage.blob.core.windows.net/test_front.jpg" },
                { "back", "https://test-storage.blob.core.windows.net/test_back.jpg" },
                { "left", "https://test-storage.blob.core.windows.net/test_left.jpg" },
                { "right", "https://test-storage.blob.core.windows.net/test_right.jpg" }
            },
            WeightLb = 180,
            Age = 32,
            Gender = "Male"
        };

        var orchestrator = new ScanOrchestrator(kernel);
        var result = await orchestrator.ProcessDailyScan(scanData);

        // Assertions
        Assert.NotNull(result.Estimation);
        Assert.NotNull(result.Deltas);
        Assert.NotNull(result.Insights);
        Assert.NotNull(result.Nutrition);
        Assert.NotNull(result.Workout);
        Assert.NotNull(result.Hydration);
    }
}
```

---

## Production Deployment

### Azure Functions Configuration

```csharp
// Function app for agent execution
[Function("ProcessDailyScan")]
public async Task<HttpResponseData> Run(
    [HttpTrigger(AuthorizationLevel.Function, "post")] HttpRequestData req,
    FunctionContext executionContext)
{
    var logger = executionContext.GetLogger("ProcessDailyScan");

    try
    {
        // Parse request
        var scanData = await req.ReadFromJsonAsync<ScanData>();

        // Initialize kernel (singleton, reuse across invocations)
        var kernel = await GetOrCreateKernelAsync();

        // Execute orchestration
        var orchestrator = new ScanOrchestrator(kernel);
        var result = await orchestrator.ProcessDailyScan(scanData);

        // Return result
        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(result);
        return response;
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to process scan");
        var response = req.CreateResponse(HttpStatusCode.InternalServerError);
        await response.WriteStringAsync("Scan processing failed");
        return response;
    }
}
```

### Environment Variables

```bash
# Azure Function App Settings
AZURE_OPENAI_ENDPOINT=https://reddyfit-openai.openai.azure.com/
AZURE_OPENAI_KEY=<from Key Vault>
AZURE_OPENAI_DEPLOYMENT=gpt-4o-vision

SUPERMEMORY_API_KEY=<from Key Vault>
SUPERMEMORY_ENDPOINT=https://api.overlap.ai/v1

FIRESTORE_PROJECT_ID=reddyfit-dcf41
GOOGLE_APPLICATION_CREDENTIALS=<service account JSON>
```

### Monitoring

```csharp
// Add Application Insights telemetry
builder.Services.AddApplicationInsightsTelemetry();

// Track agent execution metrics
using (var operation = _telemetryClient.StartOperation<RequestTelemetry>("EstimationAgent"))
{
    try
    {
        var result = await EstimateAsync(scanData);
        operation.Telemetry.Success = true;
        operation.Telemetry.ResponseCode = "200";
    }
    catch (Exception ex)
    {
        operation.Telemetry.Success = false;
        _telemetryClient.TrackException(ex);
        throw;
    }
}
```

---

## Next Steps

1. ✅ Architecture designed
2. ⏳ Implement BaseAgent class
3. ⏳ Implement 7 agents (QualityCheck → Hydration)
4. ⏳ Integrate Supermemory client
5. ⏳ Write unit tests (80% coverage)
6. ⏳ Write integration tests
7. ⏳ Deploy to Azure Functions (test environment)
8. ⏳ Performance testing (ensure <7 min total)
9. ⏳ Production deployment
10. ⏳ Monitor & optimize

---

**Document Owner**: AI/ML Team
**Last Updated**: October 7, 2025
**Status**: Design Complete, Ready for Implementation

**Generated with [Claude Code](https://claude.com/claude-code)**
**Co-Authored-By**: Claude <noreply@anthropic.com>
