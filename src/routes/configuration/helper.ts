const settings = [
    { "name": "license_key", "type": "string", "default": "" },
    { "name": "enable_openapi", "type": "boolean", "default": true },
    { "name": "enable_grafanaapi", "type": "boolean", "default": true },
    { "name": "llmchat_queue", "type": "string", "default": "" },
    { "name": "log_with_colors", "type": "boolean", "default": true },
    { "name": "log_database_queries_to_collection", "type": "string", "default": "" },
    { "name": "cache_store_type", "type": "string", "default": "memory" },
    { "name": "cache_store_max", "type": "number", "default": 1000 },
    { "name": "cache_store_ttl_seconds", "type": "number", "default": 300 },
    { "name": "cache_store_redis_host", "type": "string", "default": "" },
    { "name": "cache_store_redis_port", "type": "number", "default": 6379 },
    { "name": "cache_store_redis_password", "type": "string", "default": "" },
    { "name": "cache_workitem_queues", "type": "boolean", "default": false },
    { "name": "heapdump_onstop", "type": "boolean", "default": false },
    { "name": "amqp_allow_replyto_empty_queuename", "type": "boolean", "default": false },
    { "name": "enable_openflow_amqp", "type": "boolean", "default": false },
    { "name": "openflow_amqp_expiration", "type": "number", "default": 1500000 },
    { "name": "amqp_prefetch", "type": "number", "default": 25 },
    { "name": "enable_entity_restriction", "type": "boolean", "default": false },
    { "name": "enable_web_tours", "type": "boolean", "default": true },
    { "name": "enable_nodered_tours", "type": "boolean", "default": true },
    { "name": "grafana_url", "type": "string", "default": "" },
    { "name": "auto_hourly_housekeeping", "type": "boolean", "default": true },
    { "name": "housekeeping_skip_calculate_size", "type": "boolean", "default": false },
    { "name": "housekeeping_skip_update_user_size", "type": "boolean", "default": false },
    { "name": "housekeeping_skip_collections", "type": "string", "default": "" },
    { "name": "housekeeping_remove_unvalidated_user_days", "type": "number", "default": 0 },
    { "name": "housekeeping_cleanup_openrpa_instances", "type": "boolean", "default": false },
    { "name": "workitem_queue_monitoring_enabled", "type": "boolean", "default": true },
    { "name": "workitem_queue_monitoring_interval", "type": "number", "default": 10000 },
    { "name": "upload_max_filesize_mb", "type": "number", "default": 25 },
    { "name": "getting_started_url", "type": "string", "default": "" },
    { "name": "HTTP_PROXY", "type": "string", "default": "" },
    { "name": "HTTPS_PROXY", "type": "string", "default": "" },
    { "name": "NO_PROXY", "type": "string", "default": "" },
    { "name": "agent_HTTP_PROXY", "type": "string", "default": "" },
    { "name": "agent_HTTPS_PROXY", "type": "string", "default": "" },
    { "name": "agent_NO_PROXY", "type": "string", "default": "" },
    { "name": "agent_NPM_REGISTRY", "type": "string", "default": "" },
    { "name": "agent_NPM_TOKEN", "type": "string", "default": "" },
    { "name": "stripe_api_key", "type": "string", "default": "" },
    { "name": "stripe_api_secret", "type": "string", "default": "" },
    { "name": "stripe_force_vat", "type": "boolean", "default": false },
    { "name": "stripe_force_checkout", "type": "boolean", "default": false },
    { "name": "stripe_proration_behavior", "type": "string", "default": "always_invoice" },
    { "name": "stripe_allow_promotion_codes", "type": "boolean", "default": true },
    { "name": "stripe_log_eventhook", "type": "boolean", "default": true },
    { "name": "ensure_indexes", "type": "boolean", "default": true },
    { "name": "text_index_name_fields", "type": "string[]", "default": ["name", "_names"] },
    { "name": "auto_create_users", "type": "boolean", "default": false },
    { "name": "auto_create_user_from_jwt", "type": "boolean", "default": false },
    { "name": "auto_create_domains", "type": "string[]", "default": [] },
    { "name": "persist_user_impersonation", "type": "boolean", "default": false },
    { "name": "ping_clients_interval", "type": "number", "default": 10000 }, // 10 seconds
    { "name": "use_ingress_beta1_syntax", "type": "boolean", "default": false },
    { "name": "use_openshift_routes", "type": "boolean", "default": false },
    { "name": "agent_image_pull_secrets", "type": "string[]", "default": [] },
    { "name": "auto_create_personal_nodered_group", "type": "boolean", "default": false },
    { "name": "auto_create_personal_noderedapi_group", "type": "boolean", "default": false },
    { "name": "force_add_admins", "type": "boolean", "default": true },
    { "name": "validate_emails", "type": "boolean", "default": false },
    { "name": "forgot_pass_emails", "type": "boolean", "default": false },
    { "name": "smtp_service", "type": "string", "default": "" },
    { "name": "smtp_from", "type": "string", "default": "" },
    { "name": "smtp_user", "type": "string", "default": "" },
    { "name": "smtp_pass", "type": "string", "default": "" },
    { "name": "smtp_url", "type": "string", "default": "" },
    { "name": "debounce_lookup", "type": "boolean", "default": false },
    { "name": "validate_emails_disposable", "type": "boolean", "default": false },
    { "name": "tls_crt", "type": "string", "default": "" },
    { "name": "tls_key", "type": "string", "default": "" },
    { "name": "tls_ca", "type": "string", "default": "" },
    { "name": "tls_passphrase", "type": "string", "default": "" },

    { "name": "oidc_access_token_ttl", "type": "number", "default": 480 },
    { "name": "oidc_authorization_code_ttl", "type": "number", "default": 480 },
    { "name": "oidc_client_credentials_ttl", "type": "number", "default": 480 },
    { "name": "oidc_refresh_token_ttl", "type": "number", "default": 20160 },
    { "name": "oidc_session_ttl", "type": "number", "default": 20160 },

    { "name": "oidc_cookie_key", "type": "string", "default": "" },
    { "name": "api_rate_limit", "type": "boolean", "default": true },
    { "name": "api_rate_limit_points", "type": "number", "default": 1000 },
    { "name": "api_rate_limit_duration", "type": "number", "default": 1 },
    { "name": "socket_rate_limit", "type": "boolean", "default": true },
    { "name": "socket_rate_limit_points", "type": "number", "default": 1000 },
    { "name": "socket_rate_limit_points_disconnect", "type": "number", "default": 1600 },
    { "name": "socket_rate_limit_duration", "type": "number", "default": 1 },
    { "name": "socket_error_rate_limit_points", "type": "number", "default": 30 },
    { "name": "socket_error_rate_limit_duration", "type": "number", "default": 1 },

    { "name": "client_heartbeat_timeout", "type": "number", "default": 60 },
    { "name": "client_signin_timeout", "type": "number", "default": 120 },
    { "name": "client_disconnect_signin_error", "type": "boolean", "default": false },

    { "name": "expected_max_roles", "type": "number", "default": 20000 },
    { "name": "decorate_roles_fetching_all_roles", "type": "boolean", "default": true },
    { "name": "max_recursive_group_depth", "type": "number", "default": 2 },
    { "name": "update_acl_based_on_groups", "type": "boolean", "default": true },
    { "name": "allow_merge_acl", "type": "boolean", "default": false },

    { "name": "multi_tenant", "type": "boolean", "default": false },
    { "name": "workspace_enabled", "type": "boolean", "default": false },
    { "name": "enable_guest", "type": "boolean", "default": false },
    { "name": "enable_guest_file_upload", "type": "boolean", "default": false },

    { "name": "web_hide_general_info", "type": "boolean", "default": false },
    { "name": "enable_gitserver", "type": "boolean", "default": false },
    { "name": "enable_gitserver_guest", "type": "boolean", "default": false },
    { "name": "enable_gitserver_guest_create", "type": "boolean", "default": false },


    { "name": "cleanup_on_delete_customer", "type": "boolean", "default": false },
    { "name": "cleanup_on_delete_user", "type": "boolean", "default": false },
    { "name": "api_bypass_perm_check", "type": "boolean", "default": false },
    { "name": "allow_signin_with_expired_jwt", "type": "boolean", "default": false },
    { "name": "force_audit_ts", "type": "boolean", "default": false },
    { "name": "force_dbusage_ts", "type": "boolean", "default": false },
    { "name": "migrate_audit_to_ts", "type": "boolean", "default": true },
    { "name": "websocket_package_size", "type": "number", "default": 25000 },
    { "name": "websocket_max_package_count", "type": "number", "default": 1048576 },
    { "name": "websocket_message_callback_timeout", "type": "number", "default": 3600 },
    { "name": "websocket_disconnect_out_of_sync", "type": "boolean", "default": false },
    { "name": "protocol", "type": "string", "default": "http" },
    { "name": "port", "type": "number", "default": 3000 },
    { "name": "cookie_secret", "type": "string", "default": "NLgUIsozJaxO38ze0WuHthfj2eb1eIEu" },
    { "name": "max_ace_count", "type": "number", "default": 128 },

    { "name": "amqp_reply_expiration", "type": "number", "default": 60000 },
    { "name": "amqp_force_queue_prefix", "type": "boolean", "default": false },
    { "name": "amqp_force_exchange_prefix", "type": "boolean", "default": false },
    { "name": "amqp_force_sender_has_read", "type": "boolean", "default": true },
    { "name": "amqp_force_sender_has_invoke", "type": "boolean", "default": false },
    { "name": "amqp_force_consumer_has_update", "type": "boolean", "default": false },
    { "name": "amqp_enabled_exchange", "type": "boolean", "default": false },
    { "name": "amqp_url", "type": "string", "default": "amqp://localhost" },
    { "name": "amqp_username", "type": "string", "default": "guest" },
    { "name": "amqp_password", "type": "string", "default": "guest" },

    { "name": "amqp_check_for_consumer", "type": "boolean", "default": true },
    { "name": "amqp_check_for_consumer_count", "type": "boolean", "default": false },
    { "name": "amqp_default_expiration", "type": "number", "default": 60000 },
    { "name": "amqp_requeue_time", "type": "number", "default": 1000 },
    { "name": "amqp_dlx", "type": "string", "default": "openflow-dlx" },

    { "name": "mongodb_minpoolsize", "type": "number", "default": 25 },
    { "name": "mongodb_maxpoolsize", "type": "number", "default": 25 },

    { "name": "skip_history_collections", "type": "string", "default": "audit,oauthtokens,openrpa_instances,workflow_instances,workitems,mailhist" },
    { "name": "history_delta_count", "type": "number", "default": 1000 },
    { "name": "history_obj_max_kb_size", "type": "number", "default": 10240 },
    { "name": "allow_skiphistory", "type": "boolean", "default": false },
    { "name": "max_memory_restart_mb", "type": "number", "default": 0 },
    { "name": "max_memory_query_mb", "type": "number", "default": 0 },
    { "name": "max_memory_aggregate_mb", "type": "number", "default": 0 },
    { "name": "saml_issuer", "type": "string", "default": "the-issuer" },
    { "name": "wapid_mail", "type": "string", "default": "" },
    { "name": "wapid_pub", "type": "string", "default": "" },
    { "name": "wapid_key", "type": "string", "default": "" },
    { "name": "shorttoken_expires_in", "type": "string", "default": "5m" },
    { "name": "longtoken_expires_in", "type": "string", "default": "365d" },
    { "name": "downloadtoken_expires_in", "type": "string", "default": "15m" },
    { "name": "personalnoderedtoken_expires_in", "type": "string", "default": "365d" },
    { "name": "agent_images", "type": "object[]", "default": [{ "name": "Agent", "image": "openiap/nodeagent", "languages": ["nodejs", "python"] }, { "name": "Agent+Chromium", "image": "openiap/nodechromiumagent", "chromium": true, "languages": ["nodejs", "python"] }, { "name": "NodeRED", "image": "openiap/noderedagent", "port": 3000 }, { "name": "DotNet 6", "image": "openiap/dotnetagent", "languages": ["dotnet"] }, { "name": "PowerShell 7.3", "image": "openiap/nodeagent:pwsh", "languages": ["powershell"] }] },
    { "name": "agent_domain_schema", "type": "string", "default": "" },
    { "name": "agent_node_selector", "type": "string", "default": "" },
    { "name": "agent_grpc_apihost", "type": "string", "default": "" },
    { "name": "agent_ws_apihost", "type": "string", "default": "" },
    { "name": "agent_oidc_config", "type": "string", "default": "" },
    { "name": "agent_oidc_client_id", "type": "string", "default": "" },
    { "name": "agent_oidc_client_secret", "type": "string", "default": "" },
    { "name": "agent_oidc_userinfo_endpoint", "type": "string", "default": "" },
    { "name": "agent_oidc_issuer", "type": "string", "default": "" },
    { "name": "agent_oidc_authorization_endpoint", "type": "string", "default": "" },
    { "name": "agent_oidc_token_endpoint", "type": "string", "default": "" },
    { "name": "saml_federation_metadata", "type": "string", "default": "" },
    { "name": "agent_docker_entrypoints", "type": "string", "default": "web" },
    { "name": "agent_docker_use_project", "type": "boolean", "default": false },
    { "name": "agent_docker_certresolver", "type": "string", "default": "" },
    { "name": "namespace", "type": "string", "default": "" },
    { "name": "agent_allow_nodeselector", "type": "boolean", "default": false },

    { "name": "otel_measure_nodeid", "type": "boolean", "default": false },
    { "name": "otel_measure_queued_messages", "type": "boolean", "default": false },
    { "name": "otel_measure__mongodb_watch", "type": "boolean", "default": false },
    { "name": "enable_analytics", "type": "boolean", "default": true },
    { "name": "enable_detailed_analytic", "type": "boolean", "default": false },
    { "name": "otel_debug_log", "type": "boolean", "default": false },
    { "name": "otel_warn_log", "type": "boolean", "default": false },
    { "name": "otel_err_log", "type": "boolean", "default": false },
    { "name": "otel_trace_url", "type": "string", "default": "" },
    { "name": "otel_metric_url", "type": "string", "default": "" },
    { "name": "otel_log_url", "type": "string", "default": "" },
    { "name": "otel_trace_interval", "type": "number", "default": 5000 },
    { "name": "otel_metric_interval", "type": "number", "default": 5000 },
    { "name": "otel_trace_pingclients", "type": "boolean", "default": false },
    { "name": "otel_trace_dashboardauth", "type": "boolean", "default": false },
    { "name": "otel_trace_include_query", "type": "boolean", "default": false },
    { "name": "otel_trace_connection_ips", "type": "boolean", "default": false },
    { "name": "otel_trace_mongodb_per_users", "type": "boolean", "default": false },
    { "name": "otel_trace_mongodb_query_per_users", "type": "boolean", "default": false },
    { "name": "otel_trace_mongodb_count_per_users", "type": "boolean", "default": false },
    { "name": "otel_trace_mongodb_aggregate_per_users", "type": "boolean", "default": false },
    { "name": "otel_trace_mongodb_insert_per_users", "type": "boolean", "default": false },
    { "name": "otel_trace_mongodb_update_per_users", "type": "boolean", "default": false },
    { "name": "otel_trace_mongodb_delete_per_users", "type": "boolean", "default": false },

    { "name": "grpc_keepalive_time_ms", "type": "number", "default": -1 },
    { "name": "grpc_keepalive_timeout_ms", "type": "number", "default": -1 },
    { "name": "grpc_http2_min_ping_interval_without_data_ms", "type": "number", "default": -1 },
    { "name": "grpc_max_connection_idle_ms", "type": "number", "default": -1 },
    { "name": "grpc_max_connection_age_ms", "type": "number", "default": -1 },
    { "name": "grpc_max_connection_age_grace_ms", "type": "number", "default": -1 },
    { "name": "grpc_http2_max_pings_without_data", "type": "number", "default": -1 },
    { "name": "grpc_keepalive_permit_without_calls", "type": "number", "default": -1 },
    { "name": "grpc_max_receive_message_length", "type": "number", "default": -1 },
    { "name": "grpc_max_send_message_length", "type": "number", "default": -1 },
    { "name": "validate_user_form", "type": "string", "default": "" }
]

function generateDefaultSettings() {
    const defaultSettings: any = {};
    settings.forEach(setting => {
        defaultSettings[setting.name] = setting.default;
    });
    return defaultSettings;
}

function cleanMatchingKeys(config: { [key: string]: any }) {
    const cleanedConfig = { ...config };

    settings.forEach(setting => {
        const { name, default: defaultValue } = setting;

        if (cleanedConfig.hasOwnProperty(name) && cleanedConfig[name] === defaultValue) {
            delete cleanedConfig[name];
        }
    });

    return cleanedConfig;
}

export { cleanMatchingKeys, generateDefaultSettings, settings };
