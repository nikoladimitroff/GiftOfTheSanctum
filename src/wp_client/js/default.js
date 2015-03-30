// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=329104
(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    Object.defineProperty(Node.prototype, "unsafeInnerHTML", {
        get: function () {
            return this.innerHTML;
        },
        set: function (value) {
            WinJS.Utilities.setInnerHTMLUnsafe(this, value);
        },
        enumerable: false
    });

    Client.prototype.storeAzureResult = function (result) {
        if (localSettings !== undefined) {
            localSettings.values.azureLoginData = JSON.stringify(result);
        }
    };

    Client.prototype.getAzureResult = function () {
        if (localSettings !== undefined &&
            localSettings.values.azureLoginData) {
            return JSON.parse(localSettings.values.azureLoginData);
        }
    };

    var applicationData = Windows.Storage.ApplicationData.current;
    var localSettings = applicationData.localSettings;
    var client = null;

    function loadGame() {
        client = new Client();
        client.start();
    }

    function azureLoadGame() {
        client = new Client();
        client.start();
        client.doAzureLogin();
    }

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {

            if (args.detail.previousExecutionState !==
                activation.ApplicationExecutionState.terminated) {
                var uri = new Windows.Foundation
                    .Uri("ms-appx:///sanctum_widgets.xml");
                Windows.Storage.StorageFile.getFileFromApplicationUriAsync(uri)
                    .then(
                    // Success function.
                    function (vcd) {
                        Windows.Media.SpeechRecognition.VoiceCommandManager
                            .installCommandSetsFromStorageFileAsync(vcd);
                    },
                    // Error function.
                    function (err) {
                        if (WinJS.log !== undefined) {
                            WinJS.log("File access failed.", err);
                        }
                    });

                loadGame();
                // TODO: This application has been newly launched. Initialize
                // your application here.
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            args.setPromise(WinJS.UI.processAll());
        }

        if (args.detail.kind ==
            activation.ActivationKind.webAuthenticationBrokerContinuation) {
            if (args.detail.webAuthenticationResult.responseData) {
                var token = JSON.parse(decodeURIComponent(args.detail
                    .webAuthenticationResult.responseData).split("token=")[1]);
                client.azureManager.client.currentUser = token.user;
                client.azureManager.client
                    .currentUser.mobileServiceAuthenticationToken =
                    token.authenticationToken;
                client.azureManager
                    .loadInformation(client.postAzureLogin.bind(client));
            }
            else {
                client.azureManager.client.logout();
            }
        }

        if (args.detail.kind === activation.ActivationKind.voiceCommand) {
            var speechRecognitionResult = args.detail.result;
            var voiceCommandName = speechRecognitionResult.rulePath[0];

            if (voiceCommandName === "playGame") {
                azureLoadGame();
            }
            else {
                azureLoadGame();
            }
        }

    };

    // app.oncheckpoint = function (args) {
    //     // TODO: This application is about to be suspended. Save any state
    //     // that needs to persist across suspensions here. You might use the
    //     // WinJS.Application.sessionState object, which is automatically
    //     // saved and restored across suspension. If you need to complete an
    //     // asynchronous operation before your application is suspended, call
    //     // args.setPromise().
    // };

    app.start();
})();
