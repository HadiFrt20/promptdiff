const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

class MLflowClient {
  constructor(trackingUri) {
    this.trackingUri = (trackingUri || process.env.MLFLOW_TRACKING_URI || 'http://localhost:5000').replace(/\/+$/, '');
    const parsed = new URL(this.trackingUri);
    this.protocol = parsed.protocol === 'https:' ? https : http;
    this.host = parsed.hostname;
    this.port = parsed.port || (parsed.protocol === 'https:' ? 443 : 5000);
    this.basePath = parsed.pathname.replace(/\/+$/, '');
  }

  _request(method, apiPath, body) {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : null;
      const options = {
        hostname: this.host,
        port: this.port,
        path: this.basePath + apiPath,
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      };

      if (payload) {
        options.headers['Content-Length'] = Buffer.byteLength(payload);
      }

      const req = this.protocol.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(data ? JSON.parse(data) : {});
            } catch (e) {
              resolve({});
            }
          } else {
            let errorMsg;
            try {
              const parsed = JSON.parse(data);
              errorMsg = parsed.message || parsed.error_code || data;
            } catch (e) {
              errorMsg = data || `HTTP ${res.statusCode}`;
            }
            reject(new Error(`MLflow API error (${res.statusCode}): ${errorMsg}`));
          }
        });
      });

      req.on('error', (err) => {
        if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
          reject(new Error(
            `Cannot connect to MLflow at ${this.trackingUri}. Set MLFLOW_TRACKING_URI or start MLflow with: mlflow ui`
          ));
        } else {
          reject(new Error(`MLflow connection error: ${err.message}`));
        }
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(
          `Cannot connect to MLflow at ${this.trackingUri}. Set MLFLOW_TRACKING_URI or start MLflow with: mlflow ui`
        ));
      });

      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  }

  async createExperiment(name) {
    const res = await this._request('POST', '/api/2.0/mlflow/experiments/create', { name });
    return res.experiment_id;
  }

  async getOrCreateExperiment(name) {
    try {
      const res = await this._request('GET',
        `/api/2.0/mlflow/experiments/get-by-name?experiment_name=${encodeURIComponent(name)}`);
      if (res.experiment && res.experiment.experiment_id) {
        return res.experiment.experiment_id;
      }
    } catch (e) {
      // Experiment not found, create it
    }
    return await this.createExperiment(name);
  }

  async createRun(experimentId, tags) {
    const body = {
      experiment_id: experimentId,
      start_time: Date.now(),
    };
    if (tags) {
      body.tags = Object.entries(tags).map(([key, value]) => ({
        key,
        value: String(value),
      }));
    }
    const res = await this._request('POST', '/api/2.0/mlflow/runs/create', body);
    return res.run;
  }

  async logParam(runId, key, value) {
    await this._request('POST', '/api/2.0/mlflow/runs/log-parameter', {
      run_id: runId,
      key,
      value: String(value),
    });
  }

  async logMetric(runId, key, value) {
    await this._request('POST', '/api/2.0/mlflow/runs/log-metric', {
      run_id: runId,
      key,
      value: typeof value === 'number' ? value : parseFloat(value),
      timestamp: Date.now(),
    });
  }

  async logArtifact(runId, localPath, artifactPath) {
    // MLflow OSS artifact logging via REST requires the artifact to be uploaded
    // through the artifacts API. For local tracking server, we use set-tag to
    // record the artifact reference, then log the file content as a tag.
    const fileName = artifactPath || path.basename(localPath);
    const content = fs.readFileSync(localPath, 'utf-8');

    // Log artifact path as tag
    await this.setTag(runId, `artifact.${fileName}`, localPath);

    // For small text files (prompt files), also log content as a tag
    if (content.length <= 5000) {
      await this.setTag(runId, `artifact_content.${fileName}`, content);
    }
  }

  async setTag(runId, key, value) {
    await this._request('POST', '/api/2.0/mlflow/runs/set-tag', {
      run_id: runId,
      key,
      value: String(value),
    });
  }

  async endRun(runId, status = 'FINISHED') {
    await this._request('POST', '/api/2.0/mlflow/runs/update', {
      run_id: runId,
      status,
      end_time: Date.now(),
    });
  }

  getRunUrl(experimentId, runId) {
    return `${this.trackingUri}/#/experiments/${experimentId}/runs/${runId}`;
  }
}

module.exports = { MLflowClient };
