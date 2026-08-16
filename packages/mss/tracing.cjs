'use strict'
const process = require('process');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { PeriodicExportingMetricReader, ConsoleMetricExporter, MeterProvider } = require('@opentelemetry/sdk-metrics');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');

const init = (serviceName, environment) => {
    console.log('======================== OpenTelemetry ========================')
    const options = {port: 9464};
    const exporter = new PrometheusExporter(options);

    const exporterOptions = {
        url: 'http://localhost:9464/v1/traces'
    }
    const traceExporter = new OTLPTraceExporter(exporterOptions);
    // const sdk = new opentelemetry.NodeSDK({
    //     traceExporter,
    //     instrumentations: [getNodeAutoInstrumentations()],
    //     resource: new Resource({
    //         [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    //         [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
    //     })
    // });

    // traceExporter: consoleExporter,
    const consoleExporter = new ConsoleSpanExporter()

    const sdk = new NodeSDK({
        traceExporter: '',
        metricReader: exporter,
        instrumentations: [getNodeAutoInstrumentations()]
    });

    sdk.start()
    process.on('SIGTERM', () => {
        sdk.shutdown()
            .then(() => {
                console.log('Tracing terminated')
            })
            .catch((error) => {
                console.log('Error terminating tracing', error)
            })
            .finally(() => process.exit(0));
    });
}

module.exports = {
    init: init,
}