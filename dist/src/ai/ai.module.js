"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiModule = void 0;
const common_1 = require("@nestjs/common");
const ai_provider_interface_1 = require("./interfaces/ai.provider.interface");
const groq_ai_provider_1 = require("./providers/groq-ai.provider");
const ai_controller_1 = require("./ai.controller");
const ai_service_1 = require("./ai.service");
let AiModule = class AiModule {
};
exports.AiModule = AiModule;
exports.AiModule = AiModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        controllers: [ai_controller_1.AiController],
        providers: [
            ai_service_1.AiService,
            {
                provide: ai_provider_interface_1.AI_PROVIDER,
                useClass: groq_ai_provider_1.GroqAiProvider,
            },
        ],
        exports: [ai_provider_interface_1.AI_PROVIDER, ai_service_1.AiService],
    })
], AiModule);
//# sourceMappingURL=ai.module.js.map