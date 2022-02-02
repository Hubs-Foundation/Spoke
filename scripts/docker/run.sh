# TODO: need a better one
healthcheck(){
    while true; do (echo -e 'HTTP/1.1 200 OK\r\n\r\n 1') | nc -lp 1111 > /dev/null; done
}

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
healthcheck &
nginx -g "daemon off;"
