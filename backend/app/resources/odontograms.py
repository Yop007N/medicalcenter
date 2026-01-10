# -*- coding: utf-8 -*-
"""
Odontogram CRUD endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.odontogram import Odontogram, Tooth
from app.models.patient import Patient
from app.schemas.odontogram_schema import OdontogramSchema, ToothSchema
from app.extensions import db
from app.utils.helpers import get_pagination_params, validate_required_fields

blueprint = Blueprint('odontograms', __name__, url_prefix='/api/odontograms')

odontogram_schema = OdontogramSchema()
odontograms_schema = OdontogramSchema(many=True)
tooth_schema = ToothSchema()
teeth_schema = ToothSchema(many=True)


@blueprint.route('', methods=['GET'])
@jwt_required()
def list_odontograms():
    """List odontograms with optional patient filter
    ---
    tags:
      - Odontograms
    security:
      - Bearer: []
    parameters:
      - in: query
        name: patient_id
        type: integer
        required: false
        description: Filter by patient ID
    responses:
      200:
        description: List of odontograms
    """
    patient_id = request.args.get('patient_id', type=int)

    query = Odontogram.query

    if patient_id:
        query = query.filter_by(patient_id=patient_id)

    odontograms = query.order_by(Odontogram.created_at.desc()).all()

    return jsonify(odontograms_schema.dump(odontograms)), 200


@blueprint.route('/patient/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_patient_odontogram(patient_id):
    """Get active odontogram for a patient
    ---
    tags:
      - Odontograms
    security:
      - Bearer: []
    parameters:
      - in: path
        name: patient_id
        type: integer
        required: true
        description: ID del paciente
    responses:
      200:
        description: Odontograma activo del paciente
      404:
        description: No se encontró odontograma
    """
    # Verificar que el paciente existe
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404

    # Obtener odontograma activo
    odontogram = Odontogram.query.filter_by(
        patient_id=patient_id,
        is_active=True
    ).first()

    if not odontogram:
        return jsonify({'msg': 'No active odontogram found for this patient'}), 404

    # Obtener todos los dientes
    teeth = odontogram.teeth.all()

    return jsonify({
        'id': odontogram.id,
        'patient_id': odontogram.patient_id,
        'professional_id': odontogram.professional_id,
        'notes': odontogram.notes,
        'is_active': odontogram.is_active,
        'created_at': odontogram.created_at.isoformat(),
        'updated_at': odontogram.updated_at.isoformat(),
        'teeth': teeth_schema.dump(teeth)
    }), 200


@blueprint.route('', methods=['POST'])
@jwt_required()
def create_odontogram():
    """Create new odontogram
    ---
    tags:
      - Odontograms
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - patient_id
          properties:
            patient_id:
              type: integer
            notes:
              type: string
            teeth:
              type: array
              items:
                type: object
                properties:
                  tooth_number:
                    type: integer
                  status:
                    type: string
                  mesial:
                    type: string
                  distal:
                    type: string
                  oclusal:
                    type: string
                  vestibular:
                    type: string
                  lingual:
                    type: string
                  notes:
                    type: string
    responses:
      201:
        description: Odontograma creado exitosamente
      400:
        description: Datos inválidos
    """
    data = request.get_json() or {}

    # Validar campos requeridos
    required_fields = ['patient_id']
    is_valid, missing_fields = validate_required_fields(data, required_fields)
    if not is_valid:
        return jsonify({
            'msg': 'Missing required fields',
            'missing_fields': missing_fields
        }), 400

    # Verificar que el paciente existe
    patient = Patient.query.get(data['patient_id'])
    if not patient:
        return jsonify({'msg': 'Patient not found'}), 404

    # Desactivar odontograma anterior si existe
    previous_odontogram = Odontogram.query.filter_by(
        patient_id=data['patient_id'],
        is_active=True
    ).first()

    if previous_odontogram:
        previous_odontogram.is_active = False

    # Crear nuevo odontograma
    odontogram = Odontogram(
        patient_id=data['patient_id'],
        professional_id=get_jwt_identity(),
        notes=data.get('notes'),
        is_active=True
    )
    db.session.add(odontogram)
    db.session.flush()  # Para obtener el ID del odontograma

    # Crear registros de dientes si se proporcionaron
    teeth_data = data.get('teeth', [])
    created_teeth = []

    for tooth_data in teeth_data:
        if 'tooth_number' not in tooth_data:
            continue

        tooth = Tooth(
            odontogram_id=odontogram.id,
            tooth_number=tooth_data['tooth_number'],
            tooth_type=tooth_data.get('tooth_type', 'permanent'),
            status=tooth_data.get('status', 'healthy'),
            mesial=tooth_data.get('mesial'),
            distal=tooth_data.get('distal'),
            oclusal=tooth_data.get('oclusal'),
            vestibular=tooth_data.get('vestibular'),
            lingual=tooth_data.get('lingual'),
            notes=tooth_data.get('notes'),
            sensitivity=tooth_data.get('sensitivity'),
            mobility=tooth_data.get('mobility'),
            gingival_status=tooth_data.get('gingival_status'),
            pocket_depth=tooth_data.get('pocket_depth'),
            planned_treatment=tooth_data.get('planned_treatment'),
            treatment_priority=tooth_data.get('treatment_priority')
        )
        db.session.add(tooth)
        created_teeth.append(tooth)

    db.session.commit()

    return jsonify(odontogram_schema.dump(odontogram)), 201


@blueprint.route('/<int:odontogram_id>', methods=['GET'])
@jwt_required()
def get_odontogram(odontogram_id):
    """Get odontogram by ID
    ---
    tags:
      - Odontograms
    security:
      - Bearer: []
    parameters:
      - in: path
        name: odontogram_id
        type: integer
        required: true
    responses:
      200:
        description: Odontograma encontrado
      404:
        description: Odontograma no encontrado
    """
    odontogram = Odontogram.query.get(odontogram_id)

    if not odontogram:
        return jsonify({'msg': 'Odontogram not found'}), 404

    return jsonify(odontogram_schema.dump(odontogram)), 200


@blueprint.route('/<int:odontogram_id>', methods=['PUT'])
@jwt_required()
def update_odontogram(odontogram_id):
    """Update odontogram
    ---
    tags:
      - Odontograms
    security:
      - Bearer: []
    parameters:
      - in: path
        name: odontogram_id
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            notes:
              type: string
            is_active:
              type: boolean
    responses:
      200:
        description: Odontograma actualizado
      404:
        description: Odontograma no encontrado
    """
    odontogram = Odontogram.query.get(odontogram_id)

    if not odontogram:
        return jsonify({'msg': 'Odontogram not found'}), 404

    data = request.get_json() or {}

    # Actualizar campos permitidos
    if 'notes' in data:
        odontogram.notes = data['notes']
    if 'is_active' in data:
        odontogram.is_active = data['is_active']

    db.session.commit()

    return jsonify(odontogram_schema.dump(odontogram)), 200


@blueprint.route('/<int:odontogram_id>/tooth', methods=['POST'])
@jwt_required()
def add_tooth_to_odontogram(odontogram_id):
    """Add or update tooth in odontogram
    ---
    tags:
      - Odontograms
    security:
      - Bearer: []
    parameters:
      - in: path
        name: odontogram_id
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - tooth_number
          properties:
            tooth_number:
              type: integer
            status:
              type: string
            mesial:
              type: string
            distal:
              type: string
            oclusal:
              type: string
            vestibular:
              type: string
            lingual:
              type: string
    responses:
      201:
        description: Diente agregado/actualizado
      404:
        description: Odontograma no encontrado
    """
    odontogram = Odontogram.query.get(odontogram_id)

    if not odontogram:
        return jsonify({'msg': 'Odontogram not found'}), 404

    data = request.get_json() or {}

    # Validar campos requeridos
    required_fields = ['tooth_number']
    is_valid, missing_fields = validate_required_fields(data, required_fields)
    if not is_valid:
        return jsonify({
            'msg': 'Missing required fields',
            'missing_fields': missing_fields
        }), 400

    # Validate tooth number (FDI notation)
    tooth_number = data['tooth_number']
    # Valid permanent teeth: 11-18, 21-28, 31-38, 41-48
    # Valid deciduous teeth: 51-55, 61-65, 71-75, 81-85
    valid_permanent = range(11, 19) or range(21, 29) or range(31, 39) or range(41, 49)
    valid_deciduous = range(51, 56) or range(61, 66) or range(71, 76) or range(81, 86)

    # Check if tooth number is valid
    valid_ranges = [
        (11, 18), (21, 28), (31, 38), (41, 48),  # Permanent
        (51, 55), (61, 65), (71, 75), (81, 85)   # Deciduous
    ]
    is_valid_tooth = any(start <= tooth_number <= end for start, end in valid_ranges)

    if not is_valid_tooth:
        return jsonify({
            'msg': 'Invalid tooth number. Must be valid FDI notation (11-48 for permanent, 51-85 for deciduous)'
        }), 400

    # Verificar si el diente ya existe
    tooth = Tooth.query.filter_by(
        odontogram_id=odontogram_id,
        tooth_number=tooth_number
    ).first()

    if tooth:
        # Actualizar diente existente
        tooth.status = data.get('status', tooth.status)
        tooth.mesial = data.get('mesial', tooth.mesial)
        tooth.distal = data.get('distal', tooth.distal)
        tooth.oclusal = data.get('oclusal', tooth.oclusal)
        tooth.vestibular = data.get('vestibular', tooth.vestibular)
        tooth.lingual = data.get('lingual', tooth.lingual)
        tooth.notes = data.get('notes', tooth.notes)
        tooth.sensitivity = data.get('sensitivity', tooth.sensitivity)
        tooth.mobility = data.get('mobility', tooth.mobility)
        tooth.gingival_status = data.get('gingival_status', tooth.gingival_status)
        tooth.pocket_depth = data.get('pocket_depth', tooth.pocket_depth)
        tooth.planned_treatment = data.get('planned_treatment', tooth.planned_treatment)
        tooth.treatment_priority = data.get('treatment_priority', tooth.treatment_priority)

        message = 'Tooth updated successfully'
    else:
        # Crear nuevo diente
        tooth = Tooth(
            odontogram_id=odontogram_id,
            tooth_number=data['tooth_number'],
            tooth_type=data.get('tooth_type', 'permanent'),
            status=data.get('status', 'healthy'),
            mesial=data.get('mesial'),
            distal=data.get('distal'),
            oclusal=data.get('oclusal'),
            vestibular=data.get('vestibular'),
            lingual=data.get('lingual'),
            notes=data.get('notes'),
            sensitivity=data.get('sensitivity'),
            mobility=data.get('mobility'),
            gingival_status=data.get('gingival_status'),
            pocket_depth=data.get('pocket_depth'),
            planned_treatment=data.get('planned_treatment'),
            treatment_priority=data.get('treatment_priority')
        )
        db.session.add(tooth)
        message = 'Tooth added successfully'

    db.session.commit()

    return jsonify(tooth_schema.dump(tooth)), 201


@blueprint.route('/<int:odontogram_id>/teeth', methods=['GET'])
@jwt_required()
def get_odontogram_teeth(odontogram_id):
    """Get all teeth for an odontogram
    ---
    tags:
      - Odontograms
    security:
      - Bearer: []
    parameters:
      - in: path
        name: odontogram_id
        type: integer
        required: true
    responses:
      200:
        description: Lista de dientes del odontograma
      404:
        description: Odontograma no encontrado
    """
    odontogram = Odontogram.query.get(odontogram_id)

    if not odontogram:
        return jsonify({'msg': 'Odontogram not found'}), 404

    teeth = odontogram.teeth.all()

    return jsonify({
        'teeth': teeth_schema.dump(teeth)
    }), 200


@blueprint.route('/<int:odontogram_id>/tooth/<int:tooth_number>', methods=['GET'])
@blueprint.route('/<int:odontogram_id>/teeth/<int:tooth_number>', methods=['GET'])
@jwt_required()
def get_tooth(odontogram_id, tooth_number):
    """Get specific tooth from odontogram
    ---
    tags:
      - Odontograms
    security:
      - Bearer: []
    parameters:
      - in: path
        name: odontogram_id
        type: integer
        required: true
      - in: path
        name: tooth_number
        type: integer
        required: true
    responses:
      200:
        description: Información del diente
      404:
        description: Diente no encontrado
    """
    tooth = Tooth.query.filter_by(
        odontogram_id=odontogram_id,
        tooth_number=tooth_number
    ).first()

    if not tooth:
        return jsonify({'msg': 'Tooth not found'}), 404

    return jsonify(tooth_schema.dump(tooth)), 200


@blueprint.route('/<int:odontogram_id>/tooth/<int:tooth_number>', methods=['PUT'])
@blueprint.route('/<int:odontogram_id>/teeth/<int:tooth_number>', methods=['PUT'])
@jwt_required()
def update_tooth(odontogram_id, tooth_number):
    """Update specific tooth in odontogram
    ---
    tags:
      - Odontograms
    security:
      - Bearer: []
    parameters:
      - in: path
        name: odontogram_id
        type: integer
        required: true
      - in: path
        name: tooth_number
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            status:
              type: string
            mesial:
              type: string
            distal:
              type: string
            oclusal:
              type: string
            vestibular:
              type: string
            lingual:
              type: string
            notes:
              type: string
    responses:
      200:
        description: Diente actualizado
      404:
        description: Diente no encontrado
    """
    odontogram = Odontogram.query.get(odontogram_id)

    if not odontogram:
        return jsonify({'msg': 'Odontogram not found'}), 404

    tooth = Tooth.query.filter_by(
        odontogram_id=odontogram_id,
        tooth_number=tooth_number
    ).first()

    data = request.get_json() or {}

    if tooth:
        # Actualizar diente existente
        tooth.status = data.get('status', tooth.status)
        tooth.mesial = data.get('mesial', tooth.mesial)
        tooth.distal = data.get('distal', tooth.distal)
        tooth.oclusal = data.get('oclusal', tooth.oclusal)
        tooth.vestibular = data.get('vestibular', tooth.vestibular)
        tooth.lingual = data.get('lingual', tooth.lingual)
        tooth.notes = data.get('notes', tooth.notes)
        tooth.sensitivity = data.get('sensitivity', tooth.sensitivity)
        tooth.mobility = data.get('mobility', tooth.mobility)
        tooth.gingival_status = data.get('gingival_status', tooth.gingival_status)
        tooth.pocket_depth = data.get('pocket_depth', tooth.pocket_depth)
        tooth.planned_treatment = data.get('planned_treatment', tooth.planned_treatment)
        tooth.treatment_priority = data.get('treatment_priority', tooth.treatment_priority)
    else:
        # Crear nuevo diente si no existe
        tooth = Tooth(
            odontogram_id=odontogram_id,
            tooth_number=tooth_number,
            tooth_type=data.get('tooth_type', 'permanent'),
            status=data.get('status', 'healthy'),
            mesial=data.get('mesial'),
            distal=data.get('distal'),
            oclusal=data.get('oclusal'),
            vestibular=data.get('vestibular'),
            lingual=data.get('lingual'),
            notes=data.get('notes'),
            sensitivity=data.get('sensitivity'),
            mobility=data.get('mobility'),
            gingival_status=data.get('gingival_status'),
            pocket_depth=data.get('pocket_depth'),
            planned_treatment=data.get('planned_treatment'),
            treatment_priority=data.get('treatment_priority')
        )
        db.session.add(tooth)

    db.session.commit()

    return jsonify(tooth_schema.dump(tooth)), 200


@blueprint.route('/<int:odontogram_id>/tooth/<int:tooth_number>', methods=['DELETE'])
@blueprint.route('/<int:odontogram_id>/teeth/<int:tooth_number>', methods=['DELETE'])
@jwt_required()
def delete_tooth(odontogram_id, tooth_number):
    """Delete tooth from odontogram
    ---
    tags:
      - Odontograms
    security:
      - Bearer: []
    parameters:
      - in: path
        name: odontogram_id
        type: integer
        required: true
      - in: path
        name: tooth_number
        type: integer
        required: true
    responses:
      200:
        description: Diente eliminado
      404:
        description: Diente no encontrado
    """
    tooth = Tooth.query.filter_by(
        odontogram_id=odontogram_id,
        tooth_number=tooth_number
    ).first()

    if not tooth:
        return jsonify({'msg': 'Tooth not found'}), 404

    db.session.delete(tooth)
    db.session.commit()

    return jsonify({'msg': 'Tooth deleted successfully'}), 200
