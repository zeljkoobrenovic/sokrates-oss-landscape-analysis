
for dir in /Root_Directory_With_Zipped_Repositories/*/; do # list directories
  dir=${dir%*/}
  dir="${dir##*/}"
  echo ${dir}
  mkdir /Root_Directory_With_Unzipped_Files/${dir}
  cd /Root_Directory_With_Unzipped_Files/${dir}
  unzip -o /Root_Directory_With_Zipped_Repositories/${dir}/repo.zip '*.tf' '*.tfvars' '*.tfstate' '*.yaml' '*.yml' '*.json' '*.j2' '*.sh'
  rmdir /Root_Directory_With_Unzipped_Files/${dir} # remove directory if empty (otherwise, rm does nothing)
done
