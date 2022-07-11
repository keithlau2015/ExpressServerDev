from os import system
import sys
import getopt
import subprocess
import platform

name = "IPBlocker"
ver = "0.1"

def Msg(arg):
    print("From [" + name + "_" + ver + "] => " + str(arg))

def Main(argv):
    try:
        opts, args = getopt.getopt(argv, "a:d:", ["add=", "delete="])
        if (len(opts) == 0):
            if(len(args) > 0):
                Msg("There is no arguments!!")
                sys.stdout.flush()
                sys.exit(2)
        for opt, arg in opts:            
            if opt in ("-a", "--add"):
                if(platform.system() == "Windows"):
                    Msg("(Windows) Add IP:" + arg)
                    #subprocess.call(["sc", "config", "mpssvc", "start=auto"])
                    #subprocess.call(["net", "stop", "mpssvc", "&&", "net", "start", "mpssvc"])
                    #subprocess.call(["netsh", "advfirewall", "set", "allprofiles", "state", "on"])
                    #subprocess.call(["netsh", "advfirewall", "firewall", "and", "add", "rule", "name=", "\"BLOCK IP ADDRESS - ", arg, "\"", "dir=in", "atcion=block", "remoteip=", arg])
                    #subprocess.call(["netsh", "advfirewall", "firewall", "and", "add", "rule", "name=", "\"BLOCK IP ADDRESS - ", arg, "\"", "dir=out", "atcion=block", "remoteip=", arg])
                elif(platform.system() == "Linux"):
                    subprocess.call(["iptables", "-A", "INPUT", "-s", arg, "-j", "DROP"])
            elif opt in ("-d", "--delete"):
                if(platform.system() == "Windows"):
                    Msg("Windows delete: " + arg)
                elif(platform.system() == "Linux"):
                    subprocess.call(["iptables", "-D", "INPUT", "-s", arg, "-j", "DROP"])


    except getopt.GetoptError as err:
        Msg("Block IP failed: " + str(err))
        sys.stdout.flush()
        sys.exit(2)
    except:
        Msg("Block IP error unknown")
        sys.stdout.flush()
        sys.exit(2)

if __name__ == "__main__":
    Main(sys.argv[1:])
