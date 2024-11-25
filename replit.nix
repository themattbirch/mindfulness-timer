{pkgs}: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.nodePackages.typescript-language-server
    pkgs.yarn
    pkgs.replitPackages.jest
    
    # Canvas dependencies
    pkgs.cairo
    pkgs.pango
    pkgs.libuuid
    pkgs.libGL
    pkgs.pkg-config
    
    # Additional build tools
    pkgs.gcc
    pkgs.gnumake
  ];
}
