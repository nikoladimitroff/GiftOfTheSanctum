xcopy githooks\* .git\hooks\ /s /y
mklink /j src\wp_client\3rdparty 3rdparty
mklink /j src\wp_client\content content
mklink /j src\wp_client\distr distr
npm install