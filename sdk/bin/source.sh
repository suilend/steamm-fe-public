#!/bin/bash
trap 'echo "Error at line $LINENO: $(caller) -> Command [$BASH_COMMAND] failed with exit code $?" >&2; exit 1' ERR
set -eE

source_test_fun() {
    local move_module="$1"
    local function_name="$2"
    local file_path="temp/pyth/sources/${move_module}.move"

    # Check if file exists
    if [ ! -f "$file_path" ]; then
        echo "Error: File $file_path does not exist"
        return 1
    fi

    # Find the line number of the function
    local line_num=$(grep -n "$function_name" "$file_path" | cut -d: -f1)
    if [ -n "$line_num" ]; then
        # Delete the line before it (subtract 1 from line number)
        local remove_line=$((line_num - 1))
        sed -i '' "${remove_line}d" "$file_path"
        echo "Successfully removed #[test_only] attribute from line $remove_line"
    else
        echo "Function not found in file"
        return 1
    fi
}

# Call the function with module and function names
source_test_fun "price_info_2" "new_price_info_object_for_testing"
