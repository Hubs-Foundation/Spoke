pkg_name=spoke
pkg_origin=mozillareality
pkg_maintainer="Mozilla Mixed Reality <mixreality@mozilla.com>"

pkg_version="1.0.0"
pkg_license=('MPLv2')
pkg_description="Beaver-powered 3D scene composer."
pkg_upstream_url="https://hubs.mozilla.com/spoke"
pkg_build_deps=(
    core/coreutils
    core/bash
    core/node10
    core/yarn
    core/git
)

pkg_deps=(
    core/aws-cli # AWS cli used for run hook when uploading to S3
)

do_build() {
  ln -s "$(hab pkg path core/coreutils)/bin/env" /usr/bin/env
  yarn config set cache-folder "$(pwd)/.cache" # Set the yarn cache to a directory in the current workspace so that it can be reused across ci builds
  yarn install --frozen-lockfile

  # We inject random tokens into the build that will be replaced at run webhook/deploy time with the actual runtime configs.
  export BASE_ASSETS_PATH="$(echo "base_assets_path" | sha256sum | cut -d' ' -f1)/" # HACK need a trailing slash so webpack'ed semantics line up
  export RETICULUM_SERVER=$(echo "reticulum_server" | sha256sum | cut -d' ' -f1) 
  export THUMBNAIL_SERVER=$(echo "thumbnail_server" | sha256sum | cut -d' ' -f1) 
  export CORS_PROXY_SERVER=$(echo "cors_proxy_server" | sha256sum | cut -d' ' -f1) 
  export NON_CORS_PROXY_DOMAINS=$(echo "non_cors_proxy_domains" | sha256sum | cut -d' ' -f1) 
  export SENTRY_DSN=$(echo "sentry_dsn" | sha256sum | cut -d' ' -f1) 
  export GA_TRACKING_ID=$(echo "ga_tracking_id" | sha256sum | cut -d' ' -f1) 
  export BUILD_VERSION="${pkg_version}.$(echo $pkg_prefix | cut -d '/' -f 7)"

  yarn build

  mkdir -p dist/pages
  mv dist/*.html dist/pages
}

do_install() {
  cp -R dist "${pkg_prefix}"
}
