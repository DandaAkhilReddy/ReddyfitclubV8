# 🧠 Supermemory Integration - ReddyFit Club V8

**Service**: Overlap.ai Supermemory
**Purpose**: Infinite context memory for AI agents
**Website**: https://supermemory.ai / https://overlap.ai
**Status**: ⚠️ Requires BAA confirmation for HIPAA compliance

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Why Supermemory?](#why-supermemory)
3. [Architecture](#architecture)
4. [Integration Guide](#integration-guide)
5. [Agent Memory Patterns](#agent-memory-patterns)
6. [HIPAA Compliance](#hipaa-compliance)
7. [API Reference](#api-reference)
8. [Testing](#testing)
9. [Monitoring](#monitoring)
10. [Troubleshooting](#troubleshooting)

---

## Overview

**Supermemory** (by Overlap.ai) provides **infinite context memory** for AI agents. Unlike traditional RAG systems with fixed context windows, Supermemory dynamically retrieves relevant information from a user's entire history.

### Key Capabilities

- **Infinite Context**: No token limits for stored data
- **Semantic Search**: Find relevant context using natural language queries
- **Time-Based Queries**: "What did this user eat last week?"
- **Auto-Summarization**: Compress old context to save tokens
- **Multi-Namespace**: Separate contexts per agent (nutrition, workouts, scans, etc.)
- **Real-Time Updates**: Store new context as it's generated

### Our Use Case

Each of our 7 Semantic Kernel agents needs historical context:

| Agent | Context Needed | Supermemory Benefit |
|-------|----------------|---------------------|
| **QualityCheckAgent** | Past quality issues | Remember common user mistakes |
| **EstimationAgent** | Scan history (all time) | Compare current vs. baseline |
| **DeltaAgent** | Full scan timeline | Identify trends, volatility |
| **InsightsAgent** | User goals, preferences | Personalize advice |
| **NutritionAgent** | Meal history, dietary restrictions | Avoid suggesting foods user hates |
| **WorkoutAgent** | Exercise performance, injuries | Progressive overload, avoid injuries |
| **HydrationAgent** | Compliance patterns | Personalize reminders |

---

## Why Supermemory?

### Problem: Limited LLM Context Windows

Even GPT-4 has a finite context window (~128K tokens). For long-term users:
- 100 scans × 500 tokens = 50,000 tokens (just scan data!)
- Add nutrition logs, workout history, preferences → **exceeds context limit**

### Traditional Solutions (Suboptimal)

| Approach | Pros | Cons |
|----------|------|------|
| **Manual Prompting** | Simple | Loses historical context |
| **Vector Database (Pinecone, Weaviate)** | Good for search | Requires manual chunking, embedding management |
| **Local Embeddings** | Privacy | Limited search capabilities, no auto-summarization |

### Why Supermemory Wins

✅ **Infinite Storage**: Store entire user history
✅ **Semantic Search**: "Similar to user's best scans" → finds relevant data automatically
✅ **Auto-Summarization**: Old context compressed, recent context detailed
✅ **Multi-Modal**: Text, images, structured data (JSON)
✅ **Developer-Friendly API**: REST API, simple integration
✅ **Encryption**: AES-256 at rest (HIPAA-ready, pending BAA)

---

## Architecture

### Integration Points

```
┌──────────────────────────────────────────────────────────────────┐
│                 Semantic Kernel Agents                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │ Estimation │  │  Nutrition │  │  Workout   │  ...            │
│  │   Agent    │  │   Agent    │  │   Agent    │                │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘                │
│        │                │                │                        │
│        └────────────────┼────────────────┘                       │
│                         │                                         │
└─────────────────────────┼─────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│             Supermemory Client (ReddyFit wrapper)                │
│  • Query context                                                 │
│  • Store context                                                 │
│  • Namespace management                                          │
│  • Encryption handling                                           │
└────────────────────────┬─────────────────────────────────────────┘
                         │ HTTPS (TLS 1.3)
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│             Supermemory API (overlap.ai)                         │
│  • Endpoint: https://api.overlap.ai/v1                          │
│  • Embedding model: text-embedding-3-large                      │
│  • Vector store: Internal (managed)                             │
│  • Encryption: AES-256-GCM                                      │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. Agent needs context
   ↓
2. Agent calls SupermemoryClient.QueryAsync()
   ↓
3. Client sends HTTPS request to Supermemory API
   ↓
4. Supermemory searches user's namespace
   ↓
5. Returns relevant context (up to maxTokens limit)
   ↓
6. Agent includes context in LLM prompt
   ↓
7. LLM generates response using context
   ↓
8. Agent stores new result in Supermemory for future
```

---

## Integration Guide

### 1. Setup

#### Install SDK (if available)

```bash
# C# / .NET
dotnet add package Supermemory.Client

# TypeScript / Node.js (if needed for frontend)
npm install @supermemory/sdk
```

#### Environment Variables

```bash
SUPERMEMORY_API_KEY=<your-api-key>
SUPERMEMORY_ENDPOINT=https://api.overlap.ai/v1
SUPERMEMORY_ENCRYPTION=true  # Enable AES-256-GCM
```

### 2. Client Implementation

```csharp
// src/lib/supermemory/SupermemoryClient.cs
using System.Net.Http.Json;
using System.Security.Cryptography;

public class SupermemoryClient : ISupermemoryClient
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly bool _encryptionEnabled;

    public SupermemoryClient(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _apiKey = config["SUPERMEMORY_API_KEY"];
        _encryptionEnabled = config.GetValue<bool>("SUPERMEMORY_ENCRYPTION");

        _httpClient.BaseAddress = new Uri(config["SUPERMEMORY_ENDPOINT"]);
        _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");
    }

    public async Task<string> QueryAsync(SupermemoryQuery query)
    {
        var request = new
        {
            userId = query.UserId,
            @namespace = query.Namespace,
            query = query.Query,
            maxTokens = query.MaxTokens,
            filters = query.Filters
        };

        var response = await _httpClient.PostAsJsonAsync("/query", request);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<SupermemoryQueryResponse>();

        // Decrypt if encryption enabled
        if (_encryptionEnabled && !string.IsNullOrEmpty(result.EncryptedContent))
        {
            return DecryptContent(result.EncryptedContent);
        }

        return result.Content;
    }

    public async Task StoreAsync(SupermemoryDocument document)
    {
        // Encrypt content if enabled
        var content = _encryptionEnabled
            ? EncryptContent(document.Content)
            : document.Content;

        var request = new
        {
            userId = document.UserId,
            @namespace = document.Namespace,
            content,
            metadata = document.Metadata,
            timestamp = document.Timestamp
        };

        var response = await _httpClient.PostAsJsonAsync("/store", request);
        response.EnsureSuccessStatusCode();
    }

    private string EncryptContent(string plaintext)
    {
        // AES-256-GCM encryption
        using var aes = new AesGcm(GetEncryptionKey());
        var nonce = new byte[AesGcm.NonceByteSizes.MaxSize];
        RandomNumberGenerator.Fill(nonce);

        var plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
        var ciphertext = new byte[plaintextBytes.Length];
        var tag = new byte[AesGcm.TagByteSizes.MaxSize];

        aes.Encrypt(nonce, plaintextBytes, ciphertext, tag);

        // Return Base64: nonce||tag||ciphertext
        var combined = nonce.Concat(tag).Concat(ciphertext).ToArray();
        return Convert.ToBase64String(combined);
    }

    private string DecryptContent(string ciphertext)
    {
        var combined = Convert.FromBase64String(ciphertext);

        var nonce = combined.Take(AesGcm.NonceByteSizes.MaxSize).ToArray();
        var tag = combined.Skip(AesGcm.NonceByteSizes.MaxSize).Take(AesGcm.TagByteSizes.MaxSize).ToArray();
        var encrypted = combined.Skip(AesGcm.NonceByteSizes.MaxSize + AesGcm.TagByteSizes.MaxSize).ToArray();

        using var aes = new AesGcm(GetEncryptionKey());
        var decrypted = new byte[encrypted.Length];

        aes.Decrypt(nonce, encrypted, tag, decrypted);

        return Encoding.UTF8.GetString(decrypted);
    }

    private byte[] GetEncryptionKey()
    {
        // Retrieve from Azure Key Vault
        // For now, placeholder
        return Encoding.UTF8.GetBytes("32-byte-encryption-key-here!");
    }
}
```

### 3. Usage in Agents

```csharp
// EstimationAgent using Supermemory
public class EstimationAgent : BaseAgent
{
    public async Task<BodyCompositionEstimate> EstimateAsync(ScanData scanData)
    {
        // 1. Query historical context
        var context = await _supermemory.QueryAsync(new SupermemoryQuery
        {
            UserId = scanData.UserId,
            Namespace = "estimation_history",
            Query = "User's last 10 body composition estimates",
            MaxTokens = 10000
        });

        // 2. Build prompt with context
        var prompt = $@"
            Analyze these body scan images and estimate body fat percentage.

            User profile: Age {scanData.Age}, Gender {scanData.Gender}, Height {scanData.HeightCm}cm
            Current weight: {scanData.WeightLb}lb

            Historical context:
            {context}

            Provide your estimate...
        ";

        // 3. Call LLM (via Semantic Kernel)
        var estimate = await _kernel.InvokeAsync<BodyCompositionEstimate>(prompt);

        // 4. Store result back in Supermemory
        await _supermemory.StoreAsync(new SupermemoryDocument
        {
            UserId = scanData.UserId,
            Namespace = "estimation_history",
            Content = $"Scan {scanData.ScanId} ({scanData.Date}): BF% {estimate.BodyFatPercent}, LBM {estimate.LeanBodyMassLb}lb, Confidence {estimate.Confidence}",
            Metadata = new Dictionary<string, string>
            {
                { "scanId", scanData.ScanId },
                { "date", scanData.Date.ToString("yyyy-MM-dd") },
                { "bodyFat", estimate.BodyFatPercent.ToString() }
            },
            Timestamp = DateTime.UtcNow
        });

        return estimate;
    }
}
```

---

## Agent Memory Patterns

### 1. EstimationAgent (Scan History)

**Namespace**: `estimation_history`

**What to Store**:
```json
{
  "scanId": "scn_123",
  "date": "2025-10-07",
  "bodyFatPercent": 16.2,
  "leanBodyMassLb": 151,
  "visceralFat": 8,
  "confidence": 0.92,
  "notes": "Good lighting, full body visible"
}
```

**Query Examples**:
```csharp
// Get last 10 scans
var context = await _supermemory.QueryAsync(new SupermemoryQuery
{
    UserId = userId,
    Namespace = "estimation_history",
    Query = "Last 10 body composition estimates with dates",
    MaxTokens = 8000
});

// Find similar scans (semantic search)
var similarScans = await _supermemory.QueryAsync(new SupermemoryQuery
{
    UserId = userId,
    Namespace = "estimation_history",
    Query = "Scans where body fat was between 15-17%",
    MaxTokens = 5000
});
```

### 2. NutritionAgent (Meal & Preference History)

**Namespace**: `nutrition_preferences`

**What to Store**:
```json
{
  "dietaryRestrictions": ["vegan", "gluten-free"],
  "allergies": ["nuts", "shellfish"],
  "preferences": {
    "loves": ["quinoa", "sweet potato", "chickpeas"],
    "hates": ["tofu", "kale"],
    "neutral": ["broccoli", "rice"]
  },
  "mealCompliance": {
    "lastWeek": 0.85,  // 85% adherence
    "avgCalories": 2200,
    "avgProtein": 170
  }
}
```

**Query Examples**:
```csharp
// Get nutrition preferences
var prefs = await _supermemory.QueryAsync(new SupermemoryQuery
{
    UserId = userId,
    Namespace = "nutrition_preferences",
    Query = "User's dietary restrictions, allergies, and food preferences",
    MaxTokens = 3000
});

// Get meal compliance history
var compliance = await _supermemory.QueryAsync(new SupermemoryQuery
{
    UserId = userId,
    Namespace = "nutrition_preferences",
    Query = "Meal logging compliance patterns over last 30 days",
    MaxTokens = 2000
});
```

### 3. WorkoutAgent (Exercise History)

**Namespace**: `workout_history`

**What to Store**:
```json
{
  "date": "2025-10-05",
  "workoutType": "Push Day",
  "exercises": [
    {
      "name": "Bench Press",
      "weight": 185,
      "sets": 4,
      "reps": 8
    },
    {
      "name": "Overhead Press",
      "weight": 115,
      "sets": 3,
      "reps": 10
    }
  ],
  "duration": 65,  // minutes
  "notes": "Felt strong, increased bench by 5lb"
}
```

**Query Examples**:
```csharp
// Get progressive overload context
var workoutHistory = await _supermemory.QueryAsync(new SupermemoryQuery
{
    UserId = userId,
    Namespace = "workout_history",
    Query = "Last 5 bench press workouts with weight and reps",
    MaxTokens = 4000
});

// Check for injuries
var injuries = await _supermemory.QueryAsync(new SupermemoryQuery
{
    UserId = userId,
    Namespace = "workout_history",
    Query = "Any reported injuries or pain in last 90 days",
    MaxTokens = 2000
});
```

### 4. InsightsAgent (User Goals)

**Namespace**: `user_goals`

**What to Store**:
```json
{
  "primaryGoal": "Reach 12% body fat",
  "targetDate": "2025-12-31",
  "currentProgress": 0.65,  // 65% to goal
  "motivations": [
    "Improve health",
    "Feel more confident",
    "Compete in fitness challenge"
  ],
  "previousGoals": [
    {
      "goal": "Lose 20 lbs",
      "achieved": true,
      "completedDate": "2025-06-15"
    }
  ]
}
```

---

## HIPAA Compliance

### ⚠️ Current Status

**Supermemory is NOT yet confirmed HIPAA-compliant.**

**Action Items**:
1. ⏳ Contact Overlap.ai to confirm HIPAA compliance capabilities
2. ⏳ Sign Business Associate Agreement (BAA)
3. ⏳ Verify encryption at rest (AES-256)
4. ⏳ Configure audit logging for all queries/stores
5. ⏳ Test data retention policies (7 years for PHI)

### HIPAA Requirements

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| **Encryption at Rest** | AES-256-GCM | ⚠️ Verify with vendor |
| **Encryption in Transit** | TLS 1.3 | ✅ Yes (HTTPS) |
| **Access Control** | API key per user | ✅ Yes |
| **Audit Logging** | Log all queries/stores | ⏳ Implement |
| **Data Retention** | 7 years (HIPAA) | ⏳ Configure |
| **BAA** | Signed agreement | ❌ Not yet |
| **Right to Access** | User can export data | ⏳ Implement |
| **Right to Delete** | User can delete data | ⏳ Implement |

### Audit Logging

```csharp
public async Task<string> QueryAsync(SupermemoryQuery query)
{
    // Log before query (PHI access)
    await _auditLogger.LogAsync(new AuditEvent
    {
        EventId = Guid.NewGuid().ToString(),
        Timestamp = DateTime.UtcNow,
        ActorId = "system",
        Action = "supermemory_query",
        ResourceType = "user_context",
        ResourceOwner = query.UserId,
        PhiAccessed = true,
        PhiTypes = new[] { query.Namespace },
        Success = true
    });

    // Execute query
    var result = await _httpClient.PostAsJsonAsync("/query", request);

    // Log result
    await _auditLogger.LogAsync(new AuditEvent
    {
        EventId = Guid.NewGuid().ToString(),
        Timestamp = DateTime.UtcNow,
        ActorId = "system",
        Action = "supermemory_query_result",
        ResourceOwner = query.UserId,
        Success = result.IsSuccessStatusCode,
        Metadata = new Dictionary<string, string>
        {
            { "tokensReturned", result.TokensUsed.ToString() }
        }
    });

    return result.Content;
}
```

### Alternative (if No BAA)

If Supermemory cannot provide BAA, **de-identify data before storing**:

```csharp
// De-identify before storing
var deidentifiedContent = $@"
    Scan {HashUserId(userId)}_{scanId} ({date}):
    - Age range: {GetAgeRange(user.Age)}
    - Body fat: {RoundToRange(bodyFat)}
    - Region: {user.State}  // Not city
";

await _supermemory.StoreAsync(new SupermemoryDocument
{
    UserId = HashUserId(userId),  // One-way hash
    Namespace = "estimation_history",
    Content = deidentifiedContent
});
```

---

## API Reference

### Query Context

**Endpoint**: `POST /query`

**Request**:
```json
{
  "userId": "user123",
  "namespace": "estimation_history",
  "query": "Last 10 body composition estimates",
  "maxTokens": 10000,
  "filters": {
    "date_range": "last_90_days"
  }
}
```

**Response**:
```json
{
  "content": "Scan history for user123:\n- 2025-10-01: BF% 16.5, LBM 150lb\n- 2025-09-24: BF% 16.8, LBM 149lb\n...",
  "tokensUsed": 856,
  "sources": [
    {
      "documentId": "doc_123",
      "relevance": 0.95,
      "timestamp": "2025-10-01T10:00:00Z"
    }
  ]
}
```

### Store Context

**Endpoint**: `POST /store`

**Request**:
```json
{
  "userId": "user123",
  "namespace": "estimation_history",
  "content": "Scan scn_456: BF% 15.5, LBM 153lb, Confidence 0.92",
  "metadata": {
    "scanId": "scn_456",
    "date": "2025-10-07",
    "bodyFat": "15.5"
  },
  "timestamp": "2025-10-07T14:30:00Z"
}
```

**Response**:
```json
{
  "documentId": "doc_789",
  "success": true,
  "message": "Document stored successfully"
}
```

---

## Testing

### Unit Tests

```csharp
[Fact]
public async Task QueryAsync_ValidRequest_ReturnsContext()
{
    // Arrange
    var mockHttp = new MockHttpMessageHandler();
    mockHttp
        .When("https://api.overlap.ai/v1/query")
        .Respond("application/json", JsonSerializer.Serialize(new
        {
            content = "Test context",
            tokensUsed = 100
        }));

    var client = new SupermemoryClient(
        new HttpClient(mockHttp),
        mockConfig
    );

    // Act
    var result = await client.QueryAsync(new SupermemoryQuery
    {
        UserId = "user123",
        Namespace = "test",
        Query = "test query"
    });

    // Assert
    Assert.Equal("Test context", result);
}
```

### Integration Tests

```csharp
[Fact]
public async Task StoreAndQuery_EndToEnd_Success()
{
    // Use real Supermemory API (test environment)
    var client = GetRealSupermemoryClient();

    // Store context
    await client.StoreAsync(new SupermemoryDocument
    {
        UserId = "test_user_123",
        Namespace = "test_namespace",
        Content = "This is a test document with important data",
        Metadata = new Dictionary<string, string>
        {
            { "testId", "integration_test_1" }
        }
    });

    // Wait for indexing
    await Task.Delay(2000);

    // Query context
    var result = await client.QueryAsync(new SupermemoryQuery
    {
        UserId = "test_user_123",
        Namespace = "test_namespace",
        Query = "important data"
    });

    // Assertions
    Assert.Contains("important data", result);
}
```

---

## Monitoring

### Metrics to Track

```csharp
// Application Insights metrics
_telemetryClient.TrackMetric("Supermemory.QueryLatency", queryLatencyMs);
_telemetryClient.TrackMetric("Supermemory.TokensReturned", tokensUsed);
_telemetryClient.TrackMetric("Supermemory.QueriesPerUser", 1);

// Track errors
_telemetryClient.TrackException(new Exception("Supermemory query failed"), new Dictionary<string, string>
{
    { "userId", userId },
    { "namespace", @namespace },
    { "statusCode", "500" }
});
```

### Alerts

```yaml
# Azure Monitor Alerts
- name: "Supermemory High Latency"
  condition: "avg(Supermemory.QueryLatency) > 2000ms"
  window: "5 minutes"
  action: "Email"

- name: "Supermemory API Errors"
  condition: "count(Supermemory.ApiErrors) > 10"
  window: "5 minutes"
  action: "PagerDuty"
```

---

## Troubleshooting

### Common Issues

#### 1. Authentication Failed

```
Error: 401 Unauthorized
Solution: Verify SUPERMEMORY_API_KEY is correct
```

#### 2. Namespace Not Found

```
Error: 404 Namespace 'estimation_history' not found
Solution: Namespaces are auto-created on first store. Store a document first.
```

#### 3. Token Limit Exceeded

```
Error: 413 Payload Too Large
Solution: Reduce maxTokens in query (max is likely 30,000)
```

#### 4. Slow Queries

```
Issue: Queries taking >2 seconds
Solution:
- Use more specific queries
- Reduce maxTokens
- Add filters (date_range, etc.)
```

---

## Next Steps

1. ⏳ Contact Overlap.ai (confirm HIPAA + BAA)
2. ⏳ Implement SupermemoryClient wrapper
3. ⏳ Integrate with all 7 agents
4. ⏳ Add encryption layer
5. ⏳ Implement audit logging
6. ⏳ Test end-to-end (store → query → use in agent)
7. ⏳ Configure data retention (7 years)
8. ⏳ Production deployment

---

**Document Owner**: AI/ML Team
**Last Updated**: October 7, 2025
**Status**: Design Complete, Awaiting BAA Confirmation

**Generated with [Claude Code](https://claude.com/claude-code)**
**Co-Authored-By**: Claude <noreply@anthropic.com>
