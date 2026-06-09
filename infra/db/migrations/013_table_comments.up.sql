-- +goose Up

-- Table comments
-- ============================================================

COMMENT ON TABLE document.transaksi_dokumenterunggah IS 'Metadata only. Actual files are stored in Garage/S3-compatible object storage.';
COMMENT ON TABLE training.master_assignmentpelatihan IS 'Assignments are file-upload/project/report/presentation based; no quiz table is required for current scope.';
COMMENT ON TABLE dashboard.transaksi_monitoringperkembangan IS 'Time-series monitoring fact table for UMKM daily business development metrics.';

COMMENT ON VIEW dashboard.vw_dashboard_nasional_summary IS 'National dashboard KPI cards for Admin/Pemerintah.';
COMMENT ON VIEW dashboard.vw_dashboard_nasional_map_data IS 'Regional data for Indonesia map density visualization.';
COMMENT ON VIEW dashboard.vw_dashboard_nasional_laba_timeseries IS 'Time-series total laba for national dashboard trend chart.';
COMMENT ON VIEW dashboard.vw_dashboard_nasional_pendaftaran_timeseries IS 'Time-series new UMKM registration trend for national dashboard.';
