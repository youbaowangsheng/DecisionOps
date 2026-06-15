{{/*
Expand the name of the chart.
*/}}
{{- define "deciops.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "deciops.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart labels.
*/}}
{{- define "deciops.labels" -}}
helm.sh/chart: {{ include "deciops.name" . }}-{{ .Chart.Version }}
{{ include "deciops.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Create selector labels.
*/}}
{{- define "deciops.selectorLabels" -}}
app.kubernetes.io/name: {{ include "deciops.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create external database host.
*/}}
{{- define "deciops.database.host" -}}
{{- if .Values.externalDatabase.enabled }}
{{- .Values.externalDatabase.host }}
{{- else }}
{{- printf "%s-postgresql" (include "deciops.fullname" .) }}
{{- end }}
{{- end }}

{{/*
Create external database credentials secret name.
*/}}
{{- define "deciops.externalDbSecret" -}}
{{- printf "%s-external-db-secrets" (include "deciops.fullname" .) }}
{{- end }}