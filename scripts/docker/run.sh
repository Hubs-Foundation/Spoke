
#export turkeyCfg_ga_tracking_id=""
#export turkeyCfg_sentry_dsn=""

if [ -z ${turkeyCfg_thumbnail_server+x} ]; then export turkeyCfg_thumbnail_server="nearspark.reticulum.io"; fi
if [ -z ${turkeyCfg_base_assets_path+x} ]; then export turkeyCfg_base_assets_path="https://$SUB_DOMAIN-assets.$DOMAIN/spoke/"; fi
if [ -z ${turkeyCfg_non_cors_proxy_domains+x} ]; then export turkeyCfg_non_cors_proxy_domains="$SUB_DOMAIN.$DOMAIN,$SUB_DOMAIN-assets.$DOMAIN"; fi
if [ -z ${turkeyCfg_reticulum_server+x} ]; then export turkeyCfg_reticulum_server="$SUB_DOMAIN.$DOMAIN"; fi
if [ -z ${turkeyCfg_cors_proxy_server+x} ]; then export turkeyCfg_cors_proxy_server="$SUB_DOMAIN-cors.$DOMAIN"; fi
if [ -z ${turkeyCfg_shortlink_domain+x} ]; then export turkeyCfg_shortlink_domain="$SUB_DOMAIN.$DOMAIN"; fi
if [ -z ${turkeyCfg_hubs_server+x} ]; then export turkeyCfg_hubs_server="$SUB_DOMAIN.$DOMAIN"; fi
if [ -z ${turkeyCfg_is_moz+x} ]; then export turkeyCfg_is_moz="false"; fi

find /www/spoke/ -type f -name *.html -exec sed -i "s~{{rawspoke-base-assets-path}}\/~${turkeyCfg_base_assets_path}~g" {} \;
find /www/spoke/ -type f -name *.html -exec sed -i "s~{{rawspoke-base-assets-path}}~${turkeyCfg_base_assets_path}~g" {} \;
find /www/spoke/ -type f -name *.css -exec sed -i "s~{{rawspoke-base-assets-path}}\/~${turkeyCfg_base_assets_path}~g" {} \;
find /www/spoke/ -type f -name *.css -exec sed -i "s~{{rawspoke-base-assets-path}}~${turkeyCfg_base_assets_path}~g" {} \;

anchor="<!-- DO NOT REMOVE\/EDIT THIS COMMENT - META_TAGS -->"
for f in /www/spoke/pages/*.html; do
    for var in $(printenv); do
    var=$(echo $var | cut -d"=" -f1 ); prefix="turkeyCfg_";
    [[ $var == $prefix* ]] && sed -i "s/$anchor/ <meta name=\"env:${var#$prefix}\" content=\"${!var//\//\\\/}\"\/> $anchor/" $f;
    done
done

if [ "${access_log}" = "enabled" ]; then sed -i "s/access_log off;//g" /etc/nginx/conf.d/default.conf; fi

nginx -g "daemon off;"
