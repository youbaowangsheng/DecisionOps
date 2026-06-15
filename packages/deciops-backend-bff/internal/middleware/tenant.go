package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// TenantContext creates a tenant context middleware
func TenantContext() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Try to get tenant_id from JWT context (set by JWTAuth middleware)
		tenantID := GetTenantID(c)

		// If not found in JWT, try to get from X-Tenant-Id header
		if tenantID == "" {
			tenantID = c.GetHeader("X-Tenant-Id")
		}

		if tenantID == "" {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "tenant_id is required",
			})
			return
		}

		// Ensure tenant_id is set in context
		c.Set(ContextKeyTenantID, tenantID)

		c.Next()
	}
}