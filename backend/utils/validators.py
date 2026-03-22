import json
import logging
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, ValidationError
from flask import request, abort, jsonify

# Reutilizamos o logger configurado do sistema
logger = logging.getLogger('ocr_automation')

class RequestPayload(BaseModel):
    """
    Modelo Rígido para validação de dados recebidos no endpoint /api/process.
    """
    sector: str = Field(..., min_length=1)
    tests: List[str] = Field(default_factory=list)
    layout_id: Optional[str] = None
    ocr_target: Optional[str] = None

    @field_validator('tests', mode='before')
    @classmethod
    def parse_json_string(cls, v):
        """
        Converte a string JSON de testes (ex: '["T1", "T2"]') em uma lista Python garantida.
        Se vier como string pura, encapsula em lista.
        """
        if isinstance(v, str):
            try:
                data = json.loads(v)
                if isinstance(data, list):
                    return [str(x) for x in data]
                return [str(data)]
            except (json.JSONDecodeError, TypeError):
                # Se não for JSON válido mas for uma string preenchida
                return [v] if v.strip() else []
        return v if v is not None else []

    @field_validator('sector')
    @classmethod
    def sector_must_be_filled(cls, v):
        if not v or not v.strip():
            raise ValueError('O Setor é um campo obrigatório e não pode ser vazio.')
        return v.strip()

def validate_payload(model_class):
    """
    Helper de validação que consome o request.form e o valida contra o modelo.
    Dispara abort(400) imediatamente em caso de violação de contrato.
    """
    try:
        # Pega os dados do form (ignora os arquivos que ficam no request.files)
        # to_dict() resolve o MultiDict do Flask para um dicionário padrão
        data = request.form.to_dict()
        return model_class(**data)
    except ValidationError as e:
        logger.warning(f"Contrato Violado na API: {e.errors()}")
        # Retornamos um 400 customizado para o frontend entender o erro de validação
        error_msg = {"success": False, "error": "Parâmetros Inválidos", "details": e.errors()}
        # Em Flask, para retornar JSON no abort:
        from flask import make_response
        abort(make_response(jsonify(error_msg), 400))
