#!/usr/bin/env bash

set -e
set -x

TEMP_DIST_PATH="./dist"

# Replace base assets path in static references
# find $TEMP_DIST_PATH -type f -name *.html -exec sed -i "s/$(echo "base_assets_path" | sha256sum | cut -d' ' -f1)\//${BASE_ASSETS_PATH}/g" {} \;
# find $TEMP_DIST_PATH -type f -name *.css -exec sed -i "s/$(echo "base_assets_path" | sha256sum | cut -d' ' -f1)\//${BASE_ASSETS_PATH}/g" {} \;


# Inject env by splitting file on expected BUILD_CONFIGS line
cd $TEMP_DIST_PATH

for f in *.html
do
  csplit $f /META_TAGS/ > /dev/null
  cat xx00 > $f

  echo "<meta name=\"env:hubs_server\" content=\"${HUBS_SERVER}\"/>" >> $f
  echo "<meta name=\"env:reticulum_server\" content=\"${RETICULUM_SERVER}\"/>" >> $f
  echo "<meta name=\"env:cors_proxy_server\" content=\"${CORS_PROXY_SERVER}\"/>" >> $f
  echo "<meta name=\"env:thumbnail_server\" content=\"${THUMBNAIL_SERVER}\"/>" >> $f
  echo "<meta name=\"env:non_cors_proxy_domains\" content=\"${NON_CORS_PROXY_DOMAINS}\"/>" >> $f
  echo "<meta name=\"env:base_assets_path\" content=\"${BASE_ASSETS_PATH}\"/>" >> $f
  echo "<meta name=\"env:sentry_dsn\" content=\"${SENTRY_DSN}\"/>" >> $f
  echo "<meta name=\"env:ga_tracking_id\" content=\"${GA_TRACKING_ID}\"/>" >> $f
  echo "<meta name=\"env:is_moz\" content=\"${IS_MOZ}\"/>" >> $f

  cat xx01 >> $f
  rm xx00
  rm xx01
done
