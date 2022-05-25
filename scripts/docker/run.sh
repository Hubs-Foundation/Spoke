
turkeyCfg_base_assets_path="https://$SUB_DOMAIN-assets.$DOMAIN/spoke/"
turkeyCfg_cors_proxy_server="$SUB_DOMAIN-cors.$DOMAIN"
turkeyCfg_ga_tracking_id=""
turkeyCfg_hubs_server="$SUB_DOMAIN.$DOMAIN"
turkeyCfg_is_moz="false"
turkeyCfg_non_cors_proxy_domains="$SUB_DOMAIN.$DOMAIN,$SUB_DOMAIN-assets.$DOMAIN"
turkeyCfg_reticulum_server="$SUB_DOMAIN.$DOMAIN"
turkeyCfg_sentry_dsn=""
turkeyCfg_thumbnail_server="nearspark.reticulum.io"

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
nginx -g "daemon off;"
