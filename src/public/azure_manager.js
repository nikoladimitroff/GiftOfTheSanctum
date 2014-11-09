var AzureManager = (function () {
    function AzureManager() {
        this.client = new WindowsAzure.MobileServiceClient("https://sanctum.azure-mobile.net/", "ocEkaITOYwFARmtTRoufiEoXHsWBcL20");
        this.userInfo = this.client.getTable("userinfo");
    }
    Object.defineProperty(AzureManager.prototype, "loggedIn", {
        // MAKE THE LOGIN AT A DIFFERENT TIME & PLACE
        // PERHAPS A PRE-START MAIN MENU SCREEN
        // TEST IT LOADING A GAME
        get: function () {
            return this.client.currentUser != null;
        },
        enumerable: true,
        configurable: true
    });

    AzureManager.prototype.login = function (callback) {
        this.client.login("microsoftaccount").done(this.loadInformation.bind(this, callback), function (error) {
            return console.log(error);
        });
    };

    AzureManager.prototype.loadInformation = function (updateCallback) {
        var _this = this;
        var id = this.client.currentUser.userId;
        this.userInfo.read().done(function (result) {
            if (result && result[0]) {
                updateCallback(result[0]);
            } else {
                _this.userInfo.insert({
                    id: _this.client.currentUser.id
                });
            }
        }, function (error) {
            console.log(error);
        });
    };

    AzureManager.prototype.save = function (info) {
        if (this.loggedIn) {
            info = JSON.parse(JSON.stringify(info)); // Deep copy
            info.id = this.client.currentUser.userId;
            this.userInfo.update(info);
        }
    };
    return AzureManager;
})();
