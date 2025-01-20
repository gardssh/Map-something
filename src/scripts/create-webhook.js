var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var STRAVA_API_BASE = 'https://www.strava.com/api/v3';
var APP_URL = process.env.NODE_ENV === 'production'
    ? 'https://kart.gardsh.no'
    : 'http://localhost:3000';
function createWebhookSubscription() {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("".concat(STRAVA_API_BASE, "/push_subscriptions"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                            },
                            body: new URLSearchParams({
                                client_id: process.env.NEXT_PUBLIC_STRAVA_ID || '',
                                client_secret: process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET || '',
                                callback_url: "".concat(APP_URL, "/api/strava/webhook/event"),
                                verify_token: process.env.STRAVA_VERIFY_TOKEN || '',
                            }),
                        })];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    console.log('Webhook subscription created:', data);
                    return [2 /*return*/, data];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error creating webhook subscription:', error_1);
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function listWebhookSubscriptions() {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("".concat(STRAVA_API_BASE, "/push_subscriptions?").concat(new URLSearchParams({
                            client_id: process.env.NEXT_PUBLIC_STRAVA_ID || '',
                            client_secret: process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET || '',
                        })))];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    console.log('Current webhook subscriptions:', data);
                    return [2 /*return*/, data];
                case 3:
                    error_2 = _a.sent();
                    console.error('Error listing webhook subscriptions:', error_2);
                    throw error_2;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function deleteWebhookSubscription(id) {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("".concat(STRAVA_API_BASE, "/push_subscriptions/").concat(id, "?").concat(new URLSearchParams({
                            client_id: process.env.NEXT_PUBLIC_STRAVA_ID || '',
                            client_secret: process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET || '',
                        })), {
                            method: 'DELETE',
                        })];
                case 1:
                    response = _a.sent();
                    if (response.status === 204) {
                        console.log('Webhook subscription deleted successfully');
                        return [2 /*return*/, true];
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    console.error('Error deleting webhook subscription:', data);
                    return [2 /*return*/, false];
                case 3:
                    error_3 = _a.sent();
                    console.error('Error deleting webhook subscription:', error_3);
                    throw error_3;
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Example usage:
// createWebhookSubscription()
// listWebhookSubscriptions()
// deleteWebhookSubscription(subscription_id) 
