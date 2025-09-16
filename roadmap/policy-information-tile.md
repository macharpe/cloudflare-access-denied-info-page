# Policy Information Tile Implementation Plan

## Overview

This document outlines the implementation plan for adding a new "Policy Information" tile to the Access Denied page. This tile will provide users with contextual information about why their access was denied and what policies were evaluated.

## Problem Statement

Currently, when users are denied access, they only see generic error messages without understanding:
- Which specific application they tried to access
- What policy denied them access
- When the denial occurred
- What context (location, device, authentication) was involved
- What they can do to resolve the issue

## Proposed Solution

Add a new tile called "🔒 Access Policy Information" that displays actionable context about the access denial.

## Available Data Sources

### ✅ **Information We Can Display**

1. **Application Information** (from GraphQL history endpoint):
   - Application name and ID (`appId` → resolved to readable name)
   - Application URL/domain

2. **Policy Context** (from JWT token and audit logs):
   - Failed policy ID (`approvingPolicyId` from GraphQL)
   - Access denial reason (general failure)
   - Authentication method used
   - Location context (IP, country)

3. **Timeline Information**:
   - Timestamp of denial
   - Recent access attempts to same application

### ❌ **Cloudflare API Limitations**

- **No granular policy rules**: Cloudflare doesn't expose individual policy statements or which specific rule failed
- **No policy names**: Only policy IDs are available
- **No rule-level breakdowns**: Can't show "failed on device posture" vs "failed on group membership"

## Implementation Plan

### Phase 1: Backend API Enhancement

**File**: `src/main.js`

1. **Add new API endpoint**: `/api/policyinfo`
2. **Enhance request routing**: Add policy info handler to main event listener
3. **Create policy context aggregation**: Combine user details, history, and compliance data

#### New API Endpoint Implementation

```javascript
// Add to main event listener
} else if (url.pathname === "/api/policyinfo") {
  event.respondWith(handlePolicyInfo(event.request));

// New handler function
async function handlePolicyInfo(request) {
  const corsHeaders = getCorsHeaders(request);

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user details and latest failure
    const userDetailsResponse = await handleUserDetails(request);
    const historyResponse = await handleHistoryRequest(request);

    if (userDetailsResponse.status === 200 && historyResponse.status === 200) {
      const userData = await userDetailsResponse.json();
      const historyData = await historyResponse.json();

      // Get most recent failure for this user
      const latestFailure = historyData.loginHistory?.[0];

      const policyInfo = {
        applicationName: latestFailure?.applicationName || 'Unknown Application',
        applicationId: latestFailure?.dimensions?.appId,
        policyId: latestFailure?.dimensions?.approvingPolicyId,
        timestamp: latestFailure?.dimensions?.datetime,
        location: {
          country: latestFailure?.dimensions?.country,
          ip: latestFailure?.dimensions?.ipAddress
        },
        authentication: {
          method: userData?.identity?.idp_name || latestFailure?.dimensions?.identityProvider,
          hasWarp: latestFailure?.dimensions?.hasWarpEnabled,
          hasGateway: latestFailure?.dimensions?.hasGatewayEnabled
        },
        context: {
          deviceCompliant: await checkDeviceCompliance(userData?.posture),
          userGroups: userData?.identity?.groups || [],
          primaryGroup: TARGET_GROUP
        }
      };

      return new Response(JSON.stringify(policyInfo), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unable to determine policy context" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch policy information" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

// Helper function to analyze device compliance
function checkDeviceCompliance(postureData) {
  if (!postureData?.result) return null;

  const checks = Array.isArray(postureData.result) ? postureData.result : Object.values(postureData.result);
  const failedChecks = checks.filter(check => !check.success);

  return {
    isCompliant: failedChecks.length === 0,
    totalChecks: checks.length,
    failedChecks: failedChecks.length,
    failureReasons: failedChecks.map(check => check.rule_name || check.type || 'Unknown check')
  };
}
```

### Phase 2: Frontend Integration

**File**: `src/main.js` (JavaScript section)

#### 2.1 Add tile to grid layout

In `createAccessDeniedPage()` function, add new tile:

```javascript
// Add to the grid container
"'<div id=\"policy-info\" style=\"background: #ffffff; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1); border: 1px solid #e2e8f0;\"></div>',"
```

#### 2.2 Add API call to data loading

In `loadUserData()` function:

```javascript
// Add to Promise.all array
"const policyResponse = await fetch('/api/policyinfo').catch(() => null),"

// Add to variable declarations
"const policyData = policyResponse ? await policyResponse.json() : null;"

// Add to display calls
"displayPolicyInfo(policyData);"
```

#### 2.3 Create display function

```javascript
"function displayPolicyInfo(policyData) {",
"  const policyInfoEl = document.getElementById('policy-info');",
"  ",
"  if (!policyData || policyData.error) {",
"    policyInfoEl.innerHTML = '<h3 style=\"color: #0f172a; margin-bottom: 16px; font-size: 18px; font-weight: 600;\">🔒 Access Policy Information</h3><div style=\"color: #6b7280; font-style: italic;\">Policy information not available</div>';",
"    return;",
"  }",
"  ",
"  const timestamp = policyData.timestamp ? new Date(policyData.timestamp).toLocaleString() : 'Unknown';",
"  const location = policyData.location ? `${policyData.location.country} (${policyData.location.ip})` : 'Unknown';",
"  ",
"  let policyHtml = '<h3 style=\"color: #0f172a; margin-bottom: 16px; font-size: 18px; font-weight: 600;\">🔒 Access Policy Information</h3>';",
"  policyHtml += '<div style=\"display: flex; flex-direction: column; gap: 12px;\">';",
"  policyHtml += '<div><span style=\"font-weight: 500; color: #374151;\">Application:</span> <span style=\"color: #6b7280;\">' + (policyData.applicationName || 'Unknown') + '</span></div>';",
"  policyHtml += '<div style=\"display: flex; justify-content: space-between; align-items: center;\"><span style=\"font-weight: 500; color: #374151;\">Policy Status:</span><span style=\"background: #fee2e2; color: #dc2626; padding: 4px 12px; border-radius: 6px; font-size: 14px; font-weight: 600;\">ACCESS DENIED</span></div>';",
"  policyHtml += '<div><span style=\"font-weight: 500; color: #374151;\">Reason:</span> <span style=\"color: #6b7280;\">Access policy requirements not met</span></div>';",
"  policyHtml += '<div><span style=\"font-weight: 500; color: #374151;\">Timestamp:</span> <span style=\"color: #6b7280;\">' + timestamp + '</span></div>';",
"  policyHtml += '<div><span style=\"font-weight: 500; color: #374151;\">Location:</span> <span style=\"color: #6b7280;\">' + location + '</span></div>';",
"  ",
"  if (policyData.authentication?.method) {",
"    policyHtml += '<div><span style=\"font-weight: 500; color: #374151;\">Authentication:</span> <span style=\"color: #6b7280;\">' + policyData.authentication.method + '</span></div>';",
"  }",
"  ",
"  // Add compliance context if available",
"  if (policyData.context?.deviceCompliant !== null) {",
"    const compliance = policyData.context.deviceCompliant;",
"    const status = compliance.isCompliant ? { text: 'Compliant', color: '#059669', bg: '#d1fae5' } : { text: 'Non-compliant', color: '#dc2626', bg: '#fee2e2' };",
"    policyHtml += '<div style=\"display: flex; justify-content: space-between; align-items: center;\"><span style=\"font-weight: 500; color: #374151;\">Device Status:</span><span style=\"background: ' + status.bg + '; color: ' + status.color + '; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;\">' + status.text + '</span></div>';",
"    ",
"    if (!compliance.isCompliant && compliance.failureReasons?.length > 0) {",
"      policyHtml += '<div style=\"margin-top: 8px; padding: 8px; background: #fef2f2; border-radius: 4px; border-left: 3px solid #dc2626;\"><div style=\"font-size: 12px; font-weight: 500; color: #dc2626; margin-bottom: 4px;\">Device Issues:</div>';",
"      compliance.failureReasons.slice(0, 3).forEach(reason => {",
"        policyHtml += '<div style=\"font-size: 11px; color: #6b7280;\">• ' + reason + '</div>';",
"      });",
"      if (compliance.failureReasons.length > 3) {",
"        policyHtml += '<div style=\"font-size: 11px; color: #6b7280;\">• +' + (compliance.failureReasons.length - 3) + ' more issues</div>';",
"      }",
"      policyHtml += '</div>';",
"    }",
"  }",
"  ",
"  policyHtml += '</div>';",
"  policyInfoEl.innerHTML = policyHtml;",
"}",
```

## User Experience

### Expected Display

```
🔒 Access Policy Information
───────────────────────────────────────
Application: Jira Production
Policy Status: ACCESS DENIED
Reason: Access policy requirements not met
Timestamp: 2025-01-15 14:32:15
Location: Paris, France (192.168.1.100)
Authentication: Google Workspace (SAML)
Device Status: Non-compliant

Device Issues:
• macOS Version Rule
• Disk Encryption macOS
• +1 more issues
```

### Contextual Intelligence

The tile will intelligently connect policy failures to visible issues:
- **Device posture fails** → highlight "Device Status: Non-compliant" with specific issues
- **Location is blocked** → emphasize location information
- **Group membership fails** → show user's current groups vs required (when available)
- **Authentication issues** → highlight authentication method and requirements

## Benefits

### ✅ **For Users**
- **Actionable Information**: Users see what they can fix (device compliance, location, etc.)
- **Context Awareness**: Understanding of which application and when
- **Self-Service**: Reduces help desk tickets by providing clear next steps

### ✅ **For Administrators**
- **Reduced Support Load**: Users can self-diagnose common issues
- **Better User Experience**: Professional, informative denial page
- **Audit Trail**: Clear connection between denials and specific applications

### ✅ **Technical Benefits**
- **API Efficient**: Uses existing endpoints with minimal additional load
- **Privacy-Safe**: Doesn't expose internal policy logic
- **Consistent**: Matches existing tile design patterns
- **Maintainable**: Uses established codebase patterns

## Limitations and Constraints

### ❌ **Cloudflare API Limitations**

Due to Cloudflare Access API design:

- **No granular rule details**: Can't show "Group X is required but you have Group Y"
- **No policy names**: Only shows that a policy was evaluated, not specific rule names
- **No real-time policy state**: Shows last failure context, not current evaluation
- **Limited policy introspection**: Cannot enumerate policy requirements

### 🔄 **Workarounds Implemented**

1. **Contextual Inference**: Connect device posture failures to likely policy issues
2. **Historical Context**: Use most recent failure from audit logs
3. **Smart Correlation**: Link authentication method, location, and compliance state
4. **Actionable Messaging**: Focus on what users can fix rather than internal policy details

## Testing Strategy

### Unit Testing
- [ ] Test API endpoint with various user states (compliant/non-compliant devices)
- [ ] Test with missing data (no history, no posture data)
- [ ] Test error handling (API failures, malformed responses)

### Integration Testing
- [ ] Test full flow from denial to policy info display
- [ ] Test with different authentication methods (SAML, OAuth, etc.)
- [ ] Test with different device types and posture states

### User Acceptance Testing
- [ ] Verify information is helpful and actionable
- [ ] Ensure no sensitive policy information is exposed
- [ ] Confirm consistent styling with existing tiles

## Deployment Plan

### Phase 1: Development
1. Implement backend API endpoint
2. Add frontend integration
3. Test in development environment

### Phase 2: Staging
1. Deploy to staging with full feature set
2. Test with real user scenarios
3. Validate API performance impact

### Phase 3: Production
1. Deploy during maintenance window
2. Monitor API performance and error rates
3. Gather user feedback for improvements

## Future Enhancements

### Potential Improvements (API permitting)
1. **Real-time Policy Evaluation**: If Cloudflare adds policy introspection APIs
2. **Policy Rule Names**: If policy metadata becomes available
3. **Interactive Remediation**: Links to self-service portals for device compliance
4. **Admin Notifications**: Alert administrators to common policy issues

### Technical Debt
1. **Component Abstraction**: Extract tile creation into reusable functions
2. **API Caching**: Cache policy info to reduce API calls
3. **Error Recovery**: Implement retry logic for failed API calls

## Success Metrics

### User Experience
- [ ] Reduced help desk tickets related to access denials
- [ ] Improved user satisfaction with denial experience
- [ ] Increased self-service resolution rate

### Technical Performance
- [ ] API response time under 500ms
- [ ] Error rate below 1% for policy info endpoint
- [ ] No impact on existing page load performance

---

**Document Status**: Draft
**Last Updated**: 2025-01-15
**Next Review**: After Phase 1 implementation