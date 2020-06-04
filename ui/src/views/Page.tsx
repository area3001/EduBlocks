import React = require('preact');
import { Component } from 'preact';
import { getPlatform, getPlatformList } from '../platforms';
import { App, Capability, Extension, Platform, PlatformInterface } from '../types';
import * as firebase from 'firebase/app';
import { AuthModal } from './Auth';
import AlertModal from './AlertModal';
import IEModal from './IEModal';
import LoadModal from './LoadModal';
import UploadModal from './UploadModal';
import ExtensionModal from './ExtensionModal';
import BlocklyView from './BlocklyView';
import ImageModal from './ImageModal';
import Nav from './Nav';

const Cookies = require("js-cookie")

import OverModal from './OverwriteModal';
import PythonView from './PythonView';
import RemoteShellView from './RemoteShellView';
import SelectModal, { SelectModalOption } from './SelectModal';
import FirebaseSelectModal from './FirebaseSelectModal';

import TrinketView from './TrinketView';

type AdvancedFunction = 'Export Python' | 'Themes' | 'Flash Hex' | 'Serial upload' | 'Extensions' | 'Switch Language' | 'Split View';
let AdvancedFunctions: AdvancedFunction[] = ['Export Python', 'Themes', "Switch Language", "Split View"];

type ShareOptions = 'Copy Shareable URL' | 'Copy Embed Code' ;
let ShareOptions: ShareOptions[] = ['Copy Shareable URL', 'Copy Embed Code'];

type Languages = 'English' | 'French' | 'German' | 'Welsh';
const Languages: Languages[] = ['English', 'French', 'German', 'Welsh'];

const ViewModeBlockly = 'blocks';
const ViewModePython = 'python';
const ViewModeSplit = 'python';


type ViewMode = typeof ViewModeBlockly | typeof ViewModePython | typeof ViewModeSplit;

interface Props {
    app: App;
}

interface DocumentState {
    xml: string | null;
    python: string | null;
    pythonClean: boolean;
}

interface FileFirebaseSelectModalOption {
    label: string;
    ref: firebase.storage.Reference;
}

interface State {
    platform?: PlatformInterface;
    viewMode: ViewMode;
    modal: null | 'platform' | 'IE' | 'generating' | 'extensionsnew' |  'share' | 'shareoptions' | 'terminal' | 'languages' | 'samples' | 'themes' | 'extensions' | 'functions' | 'pythonOverwritten' | 'https' | 'noCode' | 'codeOverwrite' | 'progress' | 'auth' | 'error' | 'files';
    prevModal: null | 'platform' | 'IE' | 'generating' | 'share' | 'extensionsnew' | 'shareoptions' | 'terminal' | 'languages' | 'samples' | 'themes' | 'extensions' | 'functions' | 'pythonOverwritten' | 'https' | 'noCode' | 'codeOverwrite' | 'progress' | 'auth' | 'error' | 'files';
    extensionsActive: Extension[];
    progress: number;
    shareURL: string;
    doc: Readonly<DocumentState>;
    fileName: string;
    files: FileFirebaseSelectModalOption[];
}


// Labels

export let split = false;


export let navLabels: string[] = new Array();
navLabels = ["New", "Open", "Save", "Samples", "Extras", "Run", "Login", "Untitled", "Download Hex", "Download", "Themes", "Share"];

export let generic: string[] = new Array();
generic = ["Open", 
            "Go", 
            "Select", 
            "Close", 
            "Delete", 
            "Yes", 
            "No", 
            "Attention!",  
            "There is no code to run!", 
            "Changing mode will make you lose your code, do you wish to continue?", 
            "Uploading...", 
            "Select your mode",
            "Files"];

export default class Page extends Component<Props, State> {
    
    
    public remoteShellView?: RemoteShellView;

    constructor() {
        super();

        this.state = {
            viewMode: ViewModeBlockly,
            modal: 'platform',
            prevModal: null,
            extensionsActive: [],
            progress: 0,
            shareURL: "",
            fileName: 'Untitled',
            files: [],
            doc: {
                xml: null,
                python: null,
                pythonClean: true,
            },
        };
    }

    private isIE() {
        let ua = navigator.userAgent;

        var is_ie = ua.indexOf("MSIE ") > -1 || ua.indexOf("Trident/") > -1;
        
        return is_ie; 
      }

    private async readBlocklyContents(xml: string) {
        if (this.state.doc.xml === xml) {
            return;
        }

        const doc: DocumentState = {
            xml,
            python: null,
            pythonClean: true,
        };

        this.setState({ doc });

        if (split === true){
            this.switchView(ViewModeBlockly);

            await this.splitView(false);

            split = true
            this.splitView(true);
        }
        else{
            this.switchView(ViewModeBlockly);
        }
    }

    

    private updateFromBlockly(xml: string, python: string) {
        if (
            this.state.doc.xml === xml &&
            this.state.doc.python === python
        ) {
            return;
        }

        if (this.state.doc.python !== python && !this.state.doc.pythonClean) {
            this.setState({ modal: 'pythonOverwritten' });
        }

        const doc: DocumentState = {
            xml,
            python,
            pythonClean: true,
        };

        this.setState({ doc });
    }

    private updateFromPython(python: string) {
        if (this.state.doc.python === python) {
            return;
        }

        const doc: DocumentState = {
            xml: this.state.doc.xml,
            python,
            pythonClean: false,
        };

        this.setState({ doc });
    }

    private async new() {
        const doc: DocumentState = {
            xml: null,
            python: null,
            pythonClean: true,
        };
        this.setState({ doc });

        (document.getElementById("filename") as HTMLInputElement).value = "";

        this.setState({fileName: "Untitled"});

    }

    public componentDidMount() {
        let currentTheme = Cookies.get("theme")

        if (this.isIE()){
            this.setState({ modal: "IE" })
        }

        document.body.className = `theme-${currentTheme}`;

        var locURL = window.location.href.toString();

        if (window.location.hash) {
            const platformKey = window.location.hash.slice(1) as unknown as Platform;
            this.selectPlatform(platformKey);
        }

        if( locURL.indexOf('#share') >= 0){
            if( locURL.indexOf('?Python') >= 0){
                this.selectPlatform("Python");
            }
            
            if( locURL.indexOf('?MicroBit') >= 0){
                this.selectPlatform("MicroBit");
            }

            if( locURL.indexOf('?CircuitPython') >= 0){
                this.selectPlatform("CircuitPython");
            }

            if( locURL.indexOf('?RaspberryPi') >= 0){
                this.selectPlatform("RaspberryPi");
            }

            let self = this;
            var loadShareURL = window.location.href.substring(window.location.href.lastIndexOf("?") + 1);
            const decoded = atob(loadShareURL);

            const xhr = new XMLHttpRequest();
            xhr.responseType = 'text';
            xhr.onload = function (event) {
                self.readBlocklyContents(xhr.responseText);
            };
            xhr.open('GET', decoded);
            xhr.send();
            this.setState({ modal: null });

            this.delay(400);
            history.pushState(null, "", location.href.split("#")[0]);

    }
    
    }

    private toggleView(): 0 {
        switch (this.state.viewMode) {
            case ViewModeBlockly:
                return this.switchView(ViewModePython);

            case ViewModePython:
                return this.switchView(ViewModeBlockly);
        }
    }

    private switchView(viewMode: ViewMode): 0 {
        switch (viewMode) {
            case ViewModeBlockly:
                let blocklyEditor = document.getElementById('blockly') as HTMLBodyElement;
                let pythonEditor = document.getElementById('editor') as HTMLBodyElement;
                pythonEditor.style.display = "none";
                blocklyEditor.style.display = "block";
                this.setState({ viewMode: 'blocks' });

                return 0;

            case ViewModePython:
                let blockEditor = document.getElementById('blockly') as HTMLBodyElement;
                let pyEditor = document.getElementById('editor') as HTMLBodyElement;
                blockEditor.style.display = "none";
                pyEditor.style.display = "block";
                this.setState({ viewMode: 'python' });

                return 0;

            case ViewModeSplit:
                    let blocksEditor = document.getElementById('blockly') as HTMLBodyElement;
                    this.setState({ viewMode: 'blocks' });
                    this.setState({ viewMode: 'python' });
                    blocksEditor.style.display = "block";
                    return 0;
        }
    }

    private openTerminal() {
        if (!this.state.doc.python) {
            this.setState({ modal: 'noCode' });

            return;
        }

        this.setState({ modal: 'terminal' });

        if (this.remoteShellView) {
            this.remoteShellView.focus();
            this.remoteShellView.reset();

            this.props.app.runCode(this.state.doc.python);

            setTimeout(() => this.remoteShellView!.focus(), 250);
        }
    }

    private onBlocklyChange(xml: string, python: string) {
        this.updateFromBlockly(xml, python);
    }

    private onPythonChange(python: string) {
        this.updateFromPython(python);
    }


    private async openFile() {
        const user = firebase.auth().currentUser;
        if (user) {
            let self = this;
            const ref = firebase.storage().ref(`blocks/${user.uid}`);
            ref.listAll().then(function (res) {
                self.setState({
                    files: res.items.map((i) => ({
                        label: i.name,
                        ref: i,
                    })),
                    modal: 'files',
                });
            }).catch(function (error) {
                self.setState({
                    modal: 'error',
                });
                console.error(error);
            });

        } else {
            const xml = await this.props.app.openFile();
            this.readBlocklyContents(xml);
        }
    }

    private async openFirebaseFile(file: firebase.storage.Reference) {
        this.closeModal();
        let self = this;
        let newFileName = "";
        await console.log("Opening file...")
        if (file.name.indexOf("(Python)") !== -1 && this.state.platform!.key !== "Python"){
            this.selectPlatform("Python");
            newFileName = file.name.replace(" (Python)", "");
            
        }
        if (file.name.indexOf("(RPi)") !== -1 && this.state.platform!.key !== "RaspberryPi"){
            this.selectPlatform("RaspberryPi");
            newFileName = file.name.replace(" (RPi)", "");
            
        }
        if (file.name.indexOf("(microbit)") !== -1 && this.state.platform!.key !== "MicroBit"){
            this.selectPlatform("MicroBit");
            newFileName = file.name.replace(" (microbit)", "");
            
        }
        if (file.name.indexOf("(CircuitPython)") !== -1 && this.state.platform!.key !== "CircuitPython"){
            this.selectPlatform("CircuitPython");
            newFileName = file.name.replace(" (CircuitPython)", "");
            
        }

        if (file.name.indexOf("(Python)") !== -1 && this.state.platform!.key === "Python"){
            newFileName = file.name.replace(" (Python)", "");
            
        }
        if (file.name.indexOf("(RPi)") !== -1 && this.state.platform!.key === "RaspberryPi"){
            newFileName = file.name.replace(" (RPi)", "");
            
        }
        if (file.name.indexOf("(microbit)") !== -1 && this.state.platform!.key === "MicroBit"){
            newFileName = file.name.replace(" (microbit)", "");
            
        }
        if (file.name.indexOf("(CircuitPython)") !== -1 && this.state.platform!.key === "CircuitPython"){
            newFileName = file.name.replace(" (CircuitPython)", "");
        }

        (document.getElementById("filename") as HTMLInputElement).value = newFileName;

        this.setState({fileName: newFileName});
        file.getDownloadURL().then(function (url) {
            const xhr = new XMLHttpRequest();
            xhr.responseType = 'text';
            xhr.onload = function (event) {
                self.readBlocklyContents(xhr.responseText);
            };
            xhr.open('GET', url);
            xhr.send();
        }).catch(function (error) {
            self.setState({
                modal: 'error',
            });
            console.error(error);
        });

    }

    private async deleteFirebaseFile(file: firebase.storage.Reference) {
        file.delete();
        this.closeModal();
    } 

    private delay(ms: number) {
        return new Promise( resolve => setTimeout(resolve, ms) );
    }

    
    

    private async shareFirebaseFile(file: firebase.storage.Reference) {
        let filePlatform = ""
        if (file.name.indexOf("(Python)") !== -1){
            filePlatform = "Python"
        }
        if (file.name.indexOf("(RPi)") !== -1){
            filePlatform = "RaspberryPi"
        }
        if (file.name.indexOf("(microbit)") !== -1){
            filePlatform = "MicroBit"
        }
        if (file.name.indexOf("(CircuitPython)") !== -1){
            filePlatform = "CircuitPython"
        }
        let fileURL = await file.getDownloadURL();
        let newFileURL = fileURL.substring(0, fileURL.indexOf('&token='));
        const encoded = btoa(newFileURL);
        const edublocksLink = "https://beta.app.edublocks.org/#share?" + filePlatform + "?" + encoded;
        await this.setState({ shareURL: edublocksLink});
        await console.log(this.state.shareURL)
        await this.setState({ modal: "shareoptions"});
    }

    private async runShareOptions(func: ShareOptions) {
        if (func === 'Copy Shareable URL') {
            let shareableURL = "https://api.shrtco.de/v2/shorten?url=" + encodeURIComponent(this.state.shareURL);
            this.setState({ modal: "generating"});

            const response = await fetch(
                shareableURL
            );
        
            const body = await response.json();

            console.log(this.state.shareURL)
            
            if (response.ok){
                const shortLink = "https://share.edublocks.org/" + body.result.code
                await console.log(this.state.shareURL)
                await this.setState({ shareURL: shortLink});
                const el = document.createElement('textarea');
                el.value = shortLink;
                await el.setAttribute('readonly', '');
                el.style.position = 'absolute';
                el.style.left = '-9999px';
                await document.body.appendChild(el);
                await el.select();
                await document.execCommand('copy');
                await document.body.removeChild(el);
                await this.setState({ modal: "share"});
            }

            else{console.log(console.error());}
        }

        if (func === 'Copy Embed Code') {
            let shareableURL = "https://api.shrtco.de/v2/shorten?url=" + encodeURIComponent(this.state.shareURL);
            this.setState({ modal: "generating"});

            const response = await fetch(
                shareableURL
            );
        
            const body = await response.json();

            console.log(shareableURL)
            
            if (response.ok){
                const embedLink = '<iframe src="https://share.edublocks.org/' + body.result.code + '" height="600px" width="900px"></iframe>'
                await console.log(embedLink)
                await this.setState({ shareURL: embedLink});
                const el = document.createElement('textarea');
                el.value = embedLink;
                await el.setAttribute('readonly', '');
                el.style.position = 'absolute';
                el.style.left = '-9999px';
                await document.body.appendChild(el);
                await el.select();
                await document.execCommand('copy');
                await document.body.removeChild(el);
                await this.setState({ modal: "share"});
            }

            else{console.log(console.error());}
        }  
    }

    private async saveFile() {
        const xml = this.state.doc.xml;

        if (xml) {
            const user = firebase.auth().currentUser;

            if (user) {
                let self = this;
                this.setState({
                    modal: 'progress',
                });
                let plat = "";

                if (this.state.platform!.key === "Python"){
                    plat = " (Python)"
                }
                if (this.state.platform!.key === "MicroBit"){
                    plat = " (microbit)"
                }
                if (this.state.platform!.key === "RaspberryPi"){
                    plat = " (RPi)"
                }
                if (this.state.platform!.key === "CircuitPython"){
                    plat = " (CircuitPython)"
                }

                const ref = firebase.storage().ref(`blocks/${user.uid}/${this.state.fileName}${plat}`);
                const task = ref.putString(xml, undefined, {
                    contentType: 'text/xml',
                });
                task.on('state_changed', function (snapshot) {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes);
                    self.setState({
                        progress: progress,
                    });
                }, function (error) {
                    self.setState({
                        modal: 'error',
                    });
                    console.error(error);
                }, function () {
                    self.closeModal();
                });
            } else {
                await this.props.app.saveFile(this.state.fileName, xml, 'xml', 'text/xml;charset=utf-8');
            }
        }
    }

    private async downloadPython() {
        const python = this.state.doc.python;

        if (python) {
            await this.props.app.exportPython(this.state.fileName, python, this.state.extensionsActive);
        }
    }

    private async downloadHex() {
        const python = this.state.doc.python;

        if (python) {
            this.props.app.saveHex(this.state.fileName, python, this.state.extensionsActive);
        }
    }

    private async selectPlatform(platformKey: Platform) {

        const platform = await getPlatform(platformKey);

        if (platformKey === "CircuitPython"){
            let filebox = document.getElementById("filename");
            this.setState({"fileName": "code"});
            filebox!.style.display = "none";
        }
        else{
            let filebox = document.getElementById("filename");
            filebox!.style.display = "block";
        }

        if (platformKey === 'RaspberryPi') {
            let ip: string | null = null;

            if (window.location.protocol === 'https:') {
                alert('Need to switch to HTTP to access Raspberry Pi mode...');
                window.location.protocol = 'http:';
                return;
            }

            if (navigator.platform.indexOf('arm') !== -1) {
                await this.props.app.initConnection('localhost');
            } else {
                ip = prompt('Please enter your Raspberry Pi\'s IP address');

                if (!ip) return;

                try {
                    await this.props.app.initConnection(ip);
                } catch (err) {
                    console.error(err);
                }
            }
        }

        this.setState({
            platform,
            modal: null,
            extensionsActive: platform.defaultExtensions,
        });

        if (split === true){
            this.switchView(ViewModeBlockly);

            await this.splitView(false);

            split = true
            this.splitView(true);
        }
        else{
            this.switchView(ViewModeBlockly);
        }
    }


    private closeModal() {
        this.setState({ modal: this.state.prevModal, prevModal: null });
    }


    private openAuth() {
        this.setState({ modal: 'auth', prevModal: this.state.modal });
    }


    private openSamples() {
        this.setState({ modal: 'samples' });
    }

    private async selectSample(file: string) {
        this.new()
        await this.setState({ modal: null });

        const xml = this.props.app.getSample(this.state.platform!.key, file);

        await this.readBlocklyContents(xml);

        
    }


    private openThemes() {
        this.setState({ modal: 'themes' });
    }

    private selectTheme(theme: string) {
        this.closeModal();

        Cookies.set("theme", theme)

        document.body.className = `theme-${theme}`;
    }


    private openExtensions() {
        this.setState({ modal: 'extensionsnew' });
    }

    private selectExtension(extension: Extension) {
        this.closeModal();

        const { extensionsActive } = this.state;

        this.setState({
            extensionsActive: [...extensionsActive, extension],
        });
    }


    private onTerminalClose() {
        this.closeModal();
    }




    private hasCapability(capability: Capability) {
        if (!this.state.platform) return false;

        return this.state.platform.capabilities.indexOf(capability) !== -1;

    }

    private getExtensions() {
        if (!this.state.platform) return [];

        return this.state.platform.extensions;
    }


    private initTerminal(terminalView: RemoteShellView) {
        if (this.remoteShellView !== terminalView) {
            this.remoteShellView = terminalView;

            this.props.app.assignTerminal(terminalView);
        }
    }


    private getPythonCode() {
        return this.state.doc.python || '';
    }


    private openAdvancedFunctionDialog() {
        this.setState({ modal: 'functions' });
    }

    private fileChange(fileName: string) {
        this.setState({ fileName });
    }
    

    private openPlatforms() {
        this.new();
        this.setState({ modal: 'platform' });
    }

    private modeQuestion() {
        this.setState({ modal: 'codeOverwrite' });
    }

    private getAdvancedFunctionList(): SelectModalOption[] {
        let advancedFunctions = AdvancedFunctions;

        if (this.state.platform && this.state.platform.capabilities.indexOf('HexFlash') !== -1) {
            advancedFunctions = [...advancedFunctions, 'Flash Hex'];
            advancedFunctions = [...advancedFunctions, 'Extensions'];
        }

        if (this.state.platform && this.state.platform.capabilities.indexOf('SerialUpload') !== -1) {
            advancedFunctions = [...advancedFunctions, 'Serial upload'];
            advancedFunctions = [...advancedFunctions, 'Extensions'];
        }


        return advancedFunctions.map((func) => ({
            label: func,
            obj: func,
        }));
    }

    private getShareOptionsList(): SelectModalOption[] {
        let shareOptions = ShareOptions;

        return shareOptions.map((func) => ({
            label: func,
            obj: func,
        }));
    }

    private getLanguagesList(): SelectModalOption[] {
        let languages = Languages;

        return languages.map((func) => ({
            label: func,
            obj: func,
        }));
    }

    private async runLanguages(func: Languages) {
        if (func === 'English') {
            navLabels = ["New", "Open", "Save", "Samples", "Extras", "Run", "Login", "Untitled", "Download Hex", "Download", "Themes", "Share"];
            
            generic = ["Open", 
            "Go", 
            "Select", 
            "Close", 
            "Delete", 
            "Yes", 
            "No", 
            "Attention!", 
            "There is no code to run!", 
            "Changing mode will make you lose your code, do you wish to continue?", 
            "Uploading...", 
            "Select your mode",
            "Files"];

            document.getElementById("menubar")!.innerHTML = navLabels[0];
            document.getElementById("menubar")!.innerHTML = generic[0];
            await this.closeModal();
        }

        if (func === 'French') {
            navLabels = ["Nouveau", "Ouvrir", "Sauvegarder", "Exemples", "Préférences", "Exécuter", "S'identifier", "Sans Titre", "Télécharger Hex", "Télécharger", "Thèmes", "Partager"];
            
            generic = [ "Ouvert", 
                        "Aller", 
                        "Sélectionner", 
                        "Fermer", 
                        "Effacer", 
                        "Oui", 
                        "Non", 
                        "Attention!", 
                        "Il n’y a pas de code à exécuter!", 
                        "Changer le mode te fera perdre ton code, souhaites-tu continuer?",
                        "Téléchargement...", 
                        "Sélectionnez votre mode",
                        "Des dossiers"];

            document.getElementById("menubar")!.innerHTML = generic[0];
            document.getElementById("menubar")!.innerHTML = navLabels[0];
            await this.closeModal();
        }

        if (func === 'German') {
            navLabels = ["Neu", "Öffnen", "Speichern", "Proben", "Extras", "Ausführen", "Login", "Unbetitelt", "Herunterladen Hex", "Herunterladen", "Themen", "Teilen"];
            
            generic = [ "Öffnen", 
                        "Los", 
                        "Markieren", 
                        "Schließen", 
                        "Löschen", 
                        "Ja", 
                        "Nein", 
                        "Achtung!", 
                        "Es ist kein Code zum Ausführen!", 
                        "Wenn sie den Modus ändern, wird ihr Code gelöscht. Möchten sie fortfahren?", 
                        "Wird hochgeladen...", 
                        "Wählen sie ihren Modus aus",
                        "Dateien"];

            document.getElementById("menubar")!.innerHTML = generic[0];
            document.getElementById("menubar")!.innerHTML = navLabels[0];
            await this.closeModal();
        }

        if (func === 'Welsh') {
            navLabels = ["Newydd", "Agor", "Cadw", "Samplau", "Yn ychwanegol", "Rhedeg", "Mewngofnodi", "Heb enw", "Lawrlwython Hex", "Lawrlwython", "Themâu", "Rhannu"];
            
            generic = [ "Agor", 
                        "Mynd", 
                        "Dewis", 
                        "Cau", 
                        "Dileu", 
                        "Ie", 
                        "Na", 
                        "Eich sylw!", 
                        "Nid oes cod i'w redeg!", 
                        "Fe fydd newid modd yn achosi colled cod, ydych chi esiau parhau?", 
                        "Yn lanlwytho...", 
                        "Dewiswch eith modd",
                        "Ffeiliau"];

            document.getElementById("menubar")!.innerHTML = generic[0];
            document.getElementById("menubar")!.innerHTML = navLabels[0];
            await this.closeModal();
        }
    }

    private async splitView(toggle: boolean){
        if (toggle === true){
            split = true;
            let blocklyEditor = document.getElementById('blockly') as HTMLBodyElement;
            let pythonEditor = document.getElementById('python') as HTMLBodyElement;
            let editorElement = document.getElementById('editor') as HTMLBodyElement;
            let toggleElement = document.getElementById('toggleViewButton') as HTMLBodyElement;
            let exitElement = document.getElementById('ExitSplit') as HTMLBodyElement;

            blocklyEditor.style.width = "60%";
            editorElement.style.width = "40%";
            toggleElement.style.display = "none";
            exitElement.style.display = "block";

            window.dispatchEvent(new Event('resize'))

            pythonEditor.classList.add("show-editor");

            this.switchView(ViewModeSplit)

            blocklyEditor.style.display = "block";

            this.closeModal()

        }

        if (toggle === false){
            split = false;
            let editorElement = document.getElementById('editor') as HTMLBodyElement;
            let blocklyEditor = document.getElementById('blockly') as HTMLBodyElement;
            let exitElement = document.getElementById('ExitSplit') as HTMLBodyElement;
            let toggleElement = document.getElementById('toggleViewButton') as HTMLBodyElement;
            
            toggleElement.style.display = "block";
            exitElement.style.display = "none";

            window.dispatchEvent(new Event('resize'))

            blocklyEditor.style.width = "100%";
            editorElement.style.width = "100%";

            window.dispatchEvent(new Event('resize'))

            this.switchView(ViewModeBlockly);

        }
    }
    

    private async runAdvancedFunction(func: AdvancedFunction) {
        if (func === 'Export Python') {
            await this.downloadPython();
            await this.closeModal();
            
        }

        if (func === 'Themes') {
            await this.openThemes();
            
        }

        if (func === 'Split View') {
            this.splitView(true)    
        }


        if (func === 'Switch Language') {
            this.setState({ modal: 'languages' });
        }

        if (func === 'Extensions') {
            await this.openExtensions();
        }

        if (func === 'Serial upload') {
            const python = this.state.doc.python;

            if (python) {
                this.setState({ modal: 'progress', progress: 0 });

                try {
                    await this.props.app.serialUpload(python, this.state.extensionsActive, (progress) => {
                        this.setState({ progress });
                    });
                } finally {
                    this.setState({ modal: null });
                }
            }
        }

        if (func === 'Flash Hex') {
            const python = this.state.doc.python;

            if (python) {
                this.setState({ modal: 'progress', progress: 0 });

                try {
                    await this.props.app.flashHex(python, this.state.extensionsActive, (progress) => {
                        this.setState({ progress });
                    });
                } finally {
                    this.setState({ modal: null });
                }
            }
        }


    }

    

    public render() {
        const availablePlatforms = getPlatformList();

        return (
            <div id='page'>
                <ImageModal
                    title={generic[11]}
                    options={availablePlatforms}
                    visible={this.state.modal === 'platform'}
                    onSelect={(platform) => this.selectPlatform(platform.platform) && this.new()}
                    onCancel={() => {
                    }}
                />

                <AuthModal
                    visible={this.state.modal === 'auth'}
                    onClose={() => this.closeModal()}
                />

                <AlertModal
                    title={generic[7]}
                    visible={this.state.modal === 'pythonOverwritten'}
                    text={generic[8]}
                    onCancel={() => {
                    }}
                    onButtonClick={(key) => key === 'close' && this.closeModal()}
                />

                <OverModal
                    title={generic[7]}
                    visible={this.state.modal === 'codeOverwrite'}
                    text={generic[9]}
                    onCancel={() => {
                    }}
                    onButtonClick={(key) => key === 'close' && this.closeModal()}
                    onYes={(key1) => key1 === 'yes' && this.openPlatforms()}
                />

                <AlertModal
                    title={generic[7]}
                    visible={this.state.modal === 'https'}
                    text='Need to switch to HTTPS...'
                    onCancel={() => {
                    }}
                    onButtonClick={(key) => key === 'close' && this.closeModal()}
                />

                <IEModal
                    title="We're Sorry"
                    visible={this.state.modal === 'IE'}
                    text='EduBlocks no longer supports Internet Explorer. Please use Chrome or Firefox instead.'
                    onCancel={() => {
                    }}
                />

                <AlertModal
                    title={generic[7]}
                    visible={this.state.modal === 'noCode'}
                    text={generic[8]}
                    onCancel={() => {
                    }}
                    onButtonClick={(key) => key === 'close' && this.closeModal()}
                />

                <LoadModal
                    title="Generating shareable URL"
                    visible={this.state.modal === 'generating'}
                    onCancel={() => {
                    }}
                    onButtonClick={(key) => key === 'close' && this.closeModal()}
                />

                <AlertModal
                    title='Uh oh!'
                    visible={this.state.modal === 'error'}
                    text='Something went wrong'
                    onCancel={() => {
                    }}
                    onButtonClick={(key) => key === 'close' && this.closeModal()}
                />

                {this.getExtensions().length > 0 &&
                    <ExtensionModal
                        title='Extensions'
                        options={this.getExtensions().map((label) => ({ label }))}
                        selectLabel={generic[2]}
                        buttons={[]}
                        visible={this.state.modal === 'extensionsnew'}
                        onSelect={(extension) => this.selectExtension(extension.label as Extension)}
                        onButtonClick={(key) => key === 'close' && this.closeModal()}
                    />
                }

                <AlertModal
                    title={navLabels[11]}
                    visible={this.state.modal === 'share'}
                    text= {this.state.shareURL}
                    text2= "Copied to clipboard"
                    onCancel={() => {
                    }}
                    onButtonClick={(key) => key === 'close' && this.closeModal()}
                />

                <UploadModal
                    title={generic[10]}
                    visible={this.state.modal === 'progress'}
                    text={`${(this.state.progress * 100) | 0}%`}
                    progress={this.state.progress * 100}
                    onCancel={() => {
                    }}
                    onButtonClick={(key) => key === 'close' && this.closeModal()}
                />

                <Nav
                    platformImg={this.state.platform && this.state.platform.image}
                    sync={this.state.doc.pythonClean}
                    openPlatforms={() => this.openPlatforms()}
                    modeQuestion={() => this.modeQuestion()}
                    openTerminal={this.hasCapability('RemoteShell') || this.hasCapability('TrinketShell') ? () => this.openTerminal() : undefined}
                    downloadPython={this.hasCapability('PythonDownload') ? () => this.downloadPython() : undefined}
                    downloadHex={this.hasCapability('HexDownload') ? () => this.downloadHex() : undefined}
                    openCode={() => this.openFile()}
                    saveCode={() => this.saveFile()}
                    newCode={() => this.new()}
                    openSamples={() => this.openSamples()}
                    openThemes={() => this.openThemes()}
                    onFunction={() => this.openAdvancedFunctionDialog()}
                    onFileChange={(fileName) => this.fileChange(fileName)}
                    openAuth={() => this.openAuth()}
                    closeAuth={() => this.closeModal()}
                />

                <section id='workspace'>
                    <button
                        id='toggleViewButton'
                        class='toggleViewButton'
                        onClick={() => this.toggleView()}
                    >

                        {this.state.viewMode}

                    </button>

                    <button
                        id='ExitSplit'
                        class="toggleViewButton"
                        style="display: none;"
                        onClick={() => this.splitView(false)}
                    >

                        Exit Split View

                    </button>
                    

                    <BlocklyView
                        visible={this.state.viewMode === 'blocks'}
                        xml={this.state.doc.xml}
                        extensionsActive={this.state.extensionsActive}
                        onChange={(xml, python) => this.onBlocklyChange(xml, python)}
                    />

                    <PythonView
                        visible={this.state.viewMode === 'python'}
                        python={this.state.doc.python}
                        onChange={(python) => this.onPythonChange(python)}
                    />
                </section>

                {this.hasCapability('RemoteShell') &&
                    <RemoteShellView
                        ref={(c) => this.initTerminal(c)}
                        visible={this.state.modal === 'terminal'}
                        onClose={() => this.onTerminalClose()}
                    />
                }

                {this.hasCapability('TrinketShell') &&
                    <TrinketView
                        pythonCode={this.getPythonCode()}
                        visible={this.state.modal === 'terminal'}
                        onClose={() => this.onTerminalClose()}
                    />
                }

                <FirebaseSelectModal
                    title={generic[12]}
                    options={this.state.files}
                    selectLabel='Open'
                    buttons={[]}
                    visible={this.state.modal === 'files'}
                    onSelect={(file: FileFirebaseSelectModalOption) => this.openFirebaseFile(file.ref)}
                    onDelete={(file: FileFirebaseSelectModalOption) => this.deleteFirebaseFile(file.ref)}
                    onShare={(file: FileFirebaseSelectModalOption) => this.shareFirebaseFile(file.ref)}
                    onButtonClick={(key) => key === 'close' && this.closeModal()}
                />

                <SelectModal
                    title={navLabels[3]}
                    options={this.state.platform ? this.props.app.getSamples(this.state.platform.key).map((label) => ({ label })) : []}
                    selectLabel={generic[0]}
                    buttons={[]}
                    visible={this.state.modal === 'samples'}
                    onSelect={(file) => this.selectSample(file.label)}
                    onButtonClick={(key) => key === 'close' && this.closeModal()}
                />

                <SelectModal
                    title={navLabels[10]}
                    options={this.props.app.getThemes().map((label) => ({ label }))}
                    selectLabel={generic[2]}
                    buttons={[]}
                    visible={this.state.modal === 'themes'}
                    onSelect={(theme) => this.selectTheme(theme.label)}
                    onButtonClick={(key) => key === 'close' && this.closeModal()}
                />

                <SelectModal
                    title={navLabels[4]}
                    selectLabel={generic[1]}
                    buttons={[]}
                    visible={this.state.modal === 'functions'}
                    options={this.getAdvancedFunctionList()}
                    onSelect={(func) => this.runAdvancedFunction(func.label as AdvancedFunction)}
                    onButtonClick={(key) => key === 'close' && this.closeModal()}
                />

                <SelectModal
                    title={navLabels[11]}
                    selectLabel={generic[1]}
                    buttons={[]}
                    visible={this.state.modal === 'shareoptions'}
                    options={this.getShareOptionsList()}
                    onSelect={(func) => this.runShareOptions(func.label as ShareOptions)}
                    onButtonClick={(key) => key === 'close' && this.closeModal()}
                />

                <SelectModal
                    title='Switch Language'
                    selectLabel={generic[2]}
                    buttons={[]}
                    visible={this.state.modal === 'languages'}
                    options={this.getLanguagesList()}
                    onSelect={(func) => this.runLanguages(func.label as Languages)}
                    onButtonClick={(key) => key === 'close' && this.closeModal()}
                />


                {this.getExtensions().length > 0 &&
                    <SelectModal
                        title='Extensions'
                        options={this.getExtensions().map((label) => ({ label }))}
                        selectLabel={generic[2]}
                        buttons={[]}
                        visible={this.state.modal === 'extensions'}
                        onSelect={(extension) => this.selectExtension(extension.label as Extension)}
                        onButtonClick={(key) => key === 'close' && this.closeModal()}
                    />
                }

            </div>
        );
    }
}
